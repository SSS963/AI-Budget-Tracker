import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OverviewClient } from './OverviewClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [transactions, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session!.user!.id, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.budget.findMany({
      where: { userId: session!.user!.id, month, year },
    }),
  ])

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <OverviewClient
      userName={session!.user?.name || 'there'}
      stats={{ income, expenses, savings: income - expenses, savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0 }}
      recentTransactions={JSON.parse(JSON.stringify(transactions))}
      budgets={JSON.parse(JSON.stringify(budgets))}
      month={month}
      year={year}
    />
  )
}
