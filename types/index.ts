export type TransactionType = 'income' | 'expense'

export const CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Utilities',
  'Travel',
  'Subscriptions',
  'Salary',
  'Freelance',
  'Investment',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#6366f1',
  'Food & Dining': '#f59e0b',
  Transport: '#10b981',
  Entertainment: '#ec4899',
  Healthcare: '#14b8a6',
  Shopping: '#f97316',
  Education: '#8b5cf6',
  Utilities: '#64748b',
  Travel: '#06b6d4',
  Subscriptions: '#a855f7',
  Salary: '#22c55e',
  Freelance: '#84cc16',
  Investment: '#3b82f6',
  Other: '#94a3b8',
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  description: string
  category: string
  type: TransactionType
  date: string | Date
  isRecurring: boolean
  createdAt: string | Date
}

export interface Budget {
  id: string
  userId: string
  category: string
  limit: number
  month: number
  year: number
}

export interface MonthlyStats {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  topCategory: string
  transactionCount: number
}

export interface CategorySpending {
  category: string
  amount: number
  budget?: number
  percentage?: number
  color: string
}
