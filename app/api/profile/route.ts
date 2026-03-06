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

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(profile)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { ...parsed.data, userId: session.user.id },
  })

  return NextResponse.json(profile)
}
