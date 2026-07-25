import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { analyzeReport } from '@/lib/gemini'

const METRIC_MAP: Record<string, string> = {
  bloodSugar: 'BLOOD_SUGAR',
  hemoglobin: 'HEMOGLOBIN',
  cholesterolTotal: 'CHOLESTEROL_TOTAL',
  cholesterolHDL: 'CHOLESTEROL_HDL',
  cholesterolLDL: 'CHOLESTEROL_LDL',
  bloodPressureSystolic: 'BLOOD_PRESSURE_SYSTOLIC',
  bloodPressureDiastolic: 'BLOOD_PRESSURE_DIASTOLIC',
  heartRate: 'HEART_RATE',
  creatinine: 'CREATININE',
  uricAcid: 'URIC_ACID',
  vitaminD: 'VITAMIN_D',
  vitaminB12: 'VITAMIN_B12',
  thyroidTSH: 'THYROID_TSH',
}

const METRIC_UNITS: Record<string, string> = {
  BLOOD_SUGAR: 'mg/dL', HEMOGLOBIN: 'g/dL', CHOLESTEROL_TOTAL: 'mg/dL',
  CHOLESTEROL_HDL: 'mg/dL', CHOLESTEROL_LDL: 'mg/dL', BLOOD_PRESSURE_SYSTOLIC: 'mmHg',
  BLOOD_PRESSURE_DIASTOLIC: 'mmHg', HEART_RATE: 'bpm', CREATININE: 'mg/dL',
  URIC_ACID: 'mg/dL', VITAMIN_D: 'ng/mL', VITAMIN_B12: 'pg/mL', THYROID_TSH: 'mIU/L',
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { recordId, extractedText } = await req.json()
    if (!recordId || !extractedText) {
      return NextResponse.json({ error: 'Missing recordId or extractedText' }, { status: 400 })
    }

    const record = await prisma.medicalRecord.findFirst({
      where: { id: recordId, userId: user.id },
    })
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

    // Run AI analysis
    const analysis = await analyzeReport(extractedText, record.type)

    // Save extracted text and AI results to DB
    const updated = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        extractedText,
        aiSummary: analysis.summary,
        abnormalFindings: analysis.abnormalFindings || [],
        suggestions: analysis.lifestyleSuggestions || [],
        followUps: analysis.followUpRecommendations || [],
        isAnalyzed: true,
      },
    })

    // Save health metrics extracted from the report
    const metrics = analysis.extractedMetrics || {}
    const metricInserts = Object.entries(metrics)
      .filter(([key, val]) => val !== null && val !== undefined && METRIC_MAP[key])
      .map(([key, val]) => ({
        userId: user.id,
        recordId,
        metricType: METRIC_MAP[key] as any,
        value: Number(val),
        unit: METRIC_UNITS[METRIC_MAP[key]] || '',
        recordedAt: record.reportDate,
      }))

    if (metricInserts.length > 0) {
      await Promise.all(metricInserts.map(data => prisma.healthMetric.create({ data })))
    }

    return NextResponse.json({ record: updated, analysis, metricsCount: metricInserts.length })
  } catch (error: any) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
