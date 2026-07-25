import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { chatWithAI } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Fetch recent medical history for context
    const [records, medicines, emergency] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { userId: user.id, isAnalyzed: true },
        orderBy: { reportDate: 'desc' },
        take: 10,
        select: { title: true, type: true, aiSummary: true, abnormalFindings: true, reportDate: true },
      }),
      prisma.medicine.findMany({
        where: { userId: user.id, isActive: true },
        select: { name: true, dosage: true, frequency: true, purpose: true },
      }),
      prisma.emergencyProfile.findUnique({
        where: { userId: user.id },
        select: { bloodGroup: true, allergies: true, chronicDiseases: true },
      }),
    ])

    // Build medical context string
    const medicalContext = `
PATIENT PROFILE:
- Blood Group: ${emergency?.bloodGroup || 'Not specified'}
- Allergies: ${emergency?.allergies?.join(', ') || 'None recorded'}
- Chronic Diseases: ${emergency?.chronicDiseases?.join(', ') || 'None recorded'}

CURRENT MEDICATIONS (${medicines.length}):
${medicines.map(m => `- ${m.name} ${m.dosage} ${m.frequency}${m.purpose ? ` (for ${m.purpose})` : ''}`).join('\n') || 'None recorded'}

RECENT MEDICAL REPORTS (${records.length}):
${records.map(r => `
[${r.type} – ${new Date(r.reportDate).toLocaleDateString()}]
Report: ${r.title}
Summary: ${r.aiSummary || 'Not analyzed yet'}
Abnormal Findings: ${r.abnormalFindings?.join(', ') || 'None'}
`).join('\n') || 'No analyzed reports yet'}
    `.trim()

    // Fetch chat history
    const history = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    })

    // Save user message
    await prisma.chatMessage.create({
      data: { userId: user.id, role: 'USER', content: message },
    })

    // Get AI response
    const aiResponse = await chatWithAI(message, medicalContext, history)

    // Save AI response
    await prisma.chatMessage.create({
      data: { userId: user.id, role: 'ASSISTANT', content: aiResponse },
    })

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ messages: [] })

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.chatMessage.deleteMany({ where: { userId: user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 })
  }
}
