import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { emergencyProfile: true },
    })

    if (!user || !user.emergencyProfile) {
      return NextResponse.json({ error: 'Emergency profile not found' }, { status: 404 })
    }

    // Return only emergency-relevant info (no sensitive health data beyond emergency info)
    return NextResponse.json({
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Patient',
      profile: user.emergencyProfile,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch emergency profile' }, { status: 500 })
  }
}
