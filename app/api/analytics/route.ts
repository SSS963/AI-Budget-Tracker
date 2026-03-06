import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CATEGORY_COLORS } from '@/types'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  })

  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id, month, year },
  })

  // Monthly stats
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Category breakdown
  const categoryMap: Record<string, number> = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
  })

  const categorySpending = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      budget: budgets.find(b => b.category === category)?.limit,
      color: CATEGORY_COLORS[category] || '#94a3b8',
    }))
    .sort((a, b) => b.amount - a.amount)

  // Daily spending trend
  const dailyMap: Record<string, { income: number; expenses: number }> = {}
  transactions.forEach(t => {
    const day = t.date.toISOString().split('T')[0]
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expenses: 0 }
    if (t.type === 'income') dailyMap[day].income += t.amount
    else dailyMap[day].expenses += t.amount
  })

  const dailyTrend = Object.entries(dailyMap)
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Last 6 months trend
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const mTransactions = await prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: mStart, lte: mEnd } },
    })
    const mIncome = mTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const mExpenses = mTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    monthlyTrend.push({
      month: mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income: mIncome,
      expenses: mExpenses,
      savings: mIncome - mExpenses,
    })
  }

  return NextResponse.json({
    stats: {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      transactionCount: transactions.length,
      topCategory: categorySpending[0]?.category || 'N/A',
    },
    categorySpending,
    dailyTrend,
    monthlyTrend,
    budgets,
  })
}
