import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const budgetSchema = z.object({
  category: z.string().min(1),
  limit: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  const where: any = { userId: session.user.id }
  if (month) where.month = parseInt(month)
  if (year) where.year = parseInt(year)

  const budgets = await prisma.budget.findMany({ where, orderBy: { category: 'asc' } })
  return NextResponse.json(budgets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = budgetSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const budget = await prisma.budget.upsert({
    where: {
      userId_category_month_year: {
        userId: session.user.id,
        category: parsed.data.category,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
    update: { limit: parsed.data.limit },
    create: { ...parsed.data, userId: session.user.id },
  })

  return NextResponse.json(budget, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const existing = await prisma.budget.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.budget.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
