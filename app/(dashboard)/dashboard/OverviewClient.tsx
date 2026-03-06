'use client'

import { TrendingUp, TrendingDown, PiggyBank, Percent, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/types'
import type { Transaction, Budget } from '@/types'
import { TransactionModal } from '@/components/forms/TransactionModal'
import { useState } from 'react'

interface Props {
  userName: string
  stats: { income: number; expenses: number; savings: number; savingsRate: number }
  recentTransactions: Transaction[]
  budgets: Budget[]
  month: number
  year: number
}

export function OverviewClient({ userName, stats, recentTransactions, budgets, month, year }: Props) {
  const [showModal, setShowModal] = useState(false)
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label: 'Total Income', value: stats.income, icon: TrendingUp, color: 'emerald', prefix: '+' },
    { label: 'Total Expenses', value: stats.expenses, icon: TrendingDown, color: 'red', prefix: '-' },
    { label: 'Net Savings', value: stats.savings, icon: PiggyBank, color: 'blue', prefix: stats.savings >= 0 ? '+' : '' },
    { label: 'Savings Rate', value: null, rate: stats.savingsRate, icon: Percent, color: 'purple' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold">{userName.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">{getMonthName(month)} {year} overview</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const colorMap: Record<string, string> = {
            emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            red: 'text-red-400 bg-red-400/10 border-red-400/20',
            blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
            purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
          }
          const textColor = card.color === 'emerald' ? 'text-emerald-400' : card.color === 'red' ? 'text-red-400' : card.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
          return (
            <div key={card.label} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorMap[card.color]}`}>
                  <Icon size={16} />
                </div>
              </div>
              {card.rate !== undefined ? (
                <div className={`stat-value ${textColor}`}>{card.rate}%</div>
              ) : (
                <div className={`stat-value ${textColor}`}>{formatCurrency(card.value!)}</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-xs text-emerald-400 hover:text-emerald-300">View all →</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No transactions yet</p>
              <button onClick={() => setShowModal(true)} className="text-emerald-400 text-xs mt-2 hover:underline">Add your first one</button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: (CATEGORY_COLORS[t.category] || '#94a3b8') + '20', color: CATEGORY_COLORS[t.category] || '#94a3b8' }}
                  >
                    {t.category[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {formatDate(t.date)}</p>
                  </div>
                  <span className={`font-mono text-sm font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Overview */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Budgets</h2>
            <Link href="/dashboard/budgets" className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</Link>
          </div>
          {budgets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No budgets set</p>
              <Link href="/dashboard/budgets" className="text-emerald-400 text-xs mt-2 hover:underline block">Set budgets</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.slice(0, 5).map((b) => {
                const color = CATEGORY_COLORS[b.category] || '#94a3b8'
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{b.category}</span>
                      <span className="font-mono">{formatCurrency(b.limit)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full w-1/3" style={{ backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); window.location.reload() }} />}
    </div>
  )
}
