import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ metrics: {} })

    const { searchParams } = new URL(req.url)
    const metricType = searchParams.get('type')

    const where: any = { userId: user.id }
    if (metricType) where.metricType = metricType

    const metrics = await prisma.healthMetric.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
    })

    // Group by metric type for chart consumption
    const grouped: Record<string, { date: string; value: number; unit: string }[]> = {}
    for (const m of metrics) {
      if (!grouped[m.metricType]) grouped[m.metricType] = []
      grouped[m.metricType].push({
        date: m.recordedAt.toISOString().split('T')[0],
        value: m.value,
        unit: m.unit,
      })
    }

    return NextResponse.json({ metrics: grouped })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { metricType, value, unit, recordedAt } = body

    const metric = await prisma.healthMetric.create({
      data: {
        userId: user.id,
        metricType,
        value: Number(value),
        unit,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    })

    return NextResponse.json({ metric }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
