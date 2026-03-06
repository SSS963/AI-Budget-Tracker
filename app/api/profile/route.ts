import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  monthlyIncome: z.number().min(0),
  fixedExpenses: z.array(z.object({
    label: z.string(),
    category: z.string(),
    amount: z.number().min(0),
  })),
  priorities: z.array(z.string()),
  savingsGoalPct: z.number().min(0).max(100),
  lifestyleNote: z.string().max(500).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use email lookup to avoid JWT ID mismatch
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { profile: true },
  })

  return NextResponse.json(dbUser?.profile || null)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Use email lookup to get real DB user ID
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const profile = await prisma.userProfile.upsert({
    where: { userId: dbUser.id },
    update: parsed.data,
    create: { ...parsed.data, userId: dbUser.id },
  })

  return NextResponse.json(profile)
}
