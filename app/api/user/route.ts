import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Sync user from Clerk to DB
async function getOrCreateUser(clerkId: string, email: string, firstName?: string | null, lastName?: string | null, imageUrl?: string | null) {
  return prisma.user.upsert({
    where: { clerkId },
    update: { email, firstName, lastName, imageUrl },
    create: { clerkId, email, firstName: firstName ?? null, lastName: lastName ?? null, imageUrl: imageUrl ?? null },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { email, firstName, lastName, imageUrl } = body

    const user = await getOrCreateUser(userId, email, firstName, lastName, imageUrl)
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
