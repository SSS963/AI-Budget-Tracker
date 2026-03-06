'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrency, MONTHS, CURRENT_YEAR } from '@/lib/utils'
import { CATEGORIES, CATEGORY_COLORS, type Budget } from '@/types'
import { AIBudgetAdvisor } from '@/components/forms/AIBudgetAdvisor'

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [spending, setSpending] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ category: '', limit: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [budgetsRes, txRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`),
      fetch(`/api/transactions?month=${month}&year=${year}`),
    ])
    const budgetsData = await budgetsRes.json()
    const txData = await txRes.json()

    const spendingMap: Record<string, number> = {}
    txData.filter((t: any) => t.type === 'expense').forEach((t: any) => {
      spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount
    })

    setBudgets(budgetsData)
    setSpending(spendingMap)
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  async function addBudget(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: form.category, limit: parseFloat(form.limit), month, year }),
    })
    setForm({ category: '', limit: '' })
    fetchData()
    setSaving(false)
  }

  async function deleteBudget(id: string) {
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-muted-foreground text-sm mt-1">Set and track your spending limits</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Budgeted</p>
          <p className="font-mono text-lg font-medium">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
          <p className={`font-mono text-lg font-medium ${totalSpent > totalBudgeted ? 'text-red-400' : 'text-foreground'}`}>{formatCurrency(totalSpent)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Remaining</p>
          <p className={`font-mono text-lg font-medium ${totalBudgeted - totalSpent < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(totalBudgeted - totalSpent)}</p>
        </div>
      </div>

      {/* AI Advisor */}
      <AIBudgetAdvisor month={month} year={year} onApply={fetchData} />

      <div className="grid grid-cols-3 gap-6">
        {/* Add Budget Form */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Set Budget</h2>
          <form onSubmit={addBudget} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.filter(c => !['Salary', 'Freelance', 'Investment'].includes(c)).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Monthly Limit</label>
              <input
                type="number"
                value={form.limit}
                onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium py-2.5 rounded-xl text-sm transition-all"
            >
              {saving ? 'Saving...' : 'Set Budget'}
            </button>
          </form>
        </div>

        {/* Budget List */}
        <div className="col-span-2 space-y-3">
          {loading ? (
            <div className="glass rounded-2xl flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
          ) : budgets.length === 0 ? (
            <div className="glass rounded-2xl flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">No budgets set for this month</p>
            </div>
          ) : (
            budgets.map(b => {
              const spent = spending[b.category] || 0
              const pct = Math.min((spent / b.limit) * 100, 100)
              const isOver = spent > b.limit
              const isWarning = pct >= 80 && !isOver
              const color = CATEGORY_COLORS[b.category] || '#94a3b8'
              return (
                <div key={b.id} className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{ backgroundColor: color + '20', color }}>
                        {b.category[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{b.category}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(spent)} of {formatCurrency(b.limit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isOver && <AlertTriangle size={16} className="text-red-400" />}
                      {isWarning && <AlertTriangle size={16} className="text-amber-400" />}
                      {!isOver && !isWarning && spent > 0 && <CheckCircle size={16} className="text-emerald-400" />}
                      <span className={`font-mono text-sm font-medium ${isOver ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {formatCurrency(b.limit - spent)} left
                      </span>
                      <button onClick={() => deleteBudget(b.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: isOver ? '#f87171' : isWarning ? '#fbbf24' : color }}
                    />
                  </div>
                  {isOver && (
                    <p className="text-xs text-red-400 mt-2">Over budget by {formatCurrency(spent - b.limit)}</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
