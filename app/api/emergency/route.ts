import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ profile: null })

    const profile = await prisma.emergencyProfile.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { bloodGroup, allergies, chronicDiseases, currentMeds, emergencyContacts, doctorName, doctorPhone, notes } = body

    const profile = await prisma.emergencyProfile.upsert({
      where: { userId: user.id },
      update: { bloodGroup, allergies, chronicDiseases, currentMeds, emergencyContacts, doctorName, doctorPhone, notes },
      create: { userId: user.id, bloodGroup, allergies, chronicDiseases, currentMeds, emergencyContacts, doctorName, doctorPhone, notes },
    })

    return NextResponse.json({ profile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
