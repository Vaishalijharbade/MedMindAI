import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found. Please refresh.' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const reportDate = formData.get('reportDate') as string

    if (!file || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(buffer, file.name, 'medmind/reports')

    // Create record in DB
    const record = await prisma.medicalRecord.create({
      data: {
        userId: user.id,
        title,
        type: type as any,
        fileUrl: url,
        publicId,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        isAnalyzed: false,
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ records: [] })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    const records = await prisma.medicalRecord.findMany({
      where: { userId: user.id, ...(type && type !== 'ALL' ? { type: type as any } : {}) },
      orderBy: { reportDate: 'desc' },
      take: limit,
      include: { healthMetrics: true },
    })

    return NextResponse.json({ records })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}
