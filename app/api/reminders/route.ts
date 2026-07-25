import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ medicines: [] })

    const medicines = await prisma.medicine.findMany({
      where: { userId: user.id },
      include: {
        reminders: { orderBy: { dueAt: 'asc' }, take: 5 }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ medicines })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { name, dosage, frequency, purpose, startDate, endDate, reminderTimes, reminderDays } = body

    if (!name || !dosage || !frequency) {
      return NextResponse.json({ error: 'Name, dosage and frequency required' }, { status: 400 })
    }

    const medicine = await prisma.medicine.create({
      data: {
        userId: user.id,
        name,
        dosage,
        frequency,
        purpose: purpose || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    // Create reminders
    if (reminderTimes && reminderTimes.length > 0) {
      const reminderData = reminderTimes.map((time: string) => {
        const [h, m] = time.split(':').map(Number)
        const dueAt = new Date()
        dueAt.setHours(h, m, 0, 0)
        if (dueAt < new Date()) dueAt.setDate(dueAt.getDate() + 1)
        return {
          medicineId: medicine.id,
          time,
          days: reminderDays || ['MON','TUE','WED','THU','FRI','SAT','SUN'],
          dueAt,
        }
      })
      await prisma.reminder.createMany({ data: reminderData })
    }

    const result = await prisma.medicine.findUnique({
      where: { id: medicine.id },
      include: { reminders: true },
    })

    return NextResponse.json({ medicine: result }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { medicineId, isActive } = body

    const medicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: { isActive },
    })

    return NextResponse.json({ medicine })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const medicineId = searchParams.get('id')
    if (!medicineId) return NextResponse.json({ error: 'Medicine ID required' }, { status: 400 })

    await prisma.medicine.delete({ where: { id: medicineId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
