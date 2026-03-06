'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Trash2, Pencil, Filter } from 'lucide-react'
import { formatCurrency, formatDate, MONTHS, CURRENT_YEAR } from '@/lib/utils'
import { CATEGORIES, CATEGORY_COLORS, type Transaction } from '@/types'
import { TransactionModal } from '@/components/forms/TransactionModal'

export default function TransactionsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | undefined>()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/transactions?month=${month}&year=${year}`)
    const data = await res.json()
    setTransactions(data)
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function deleteTx(id: string) {
    if (!confirm('Delete this transaction?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchTransactions()
  }

  const filtered = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || t.type === typeFilter
    return matchSearch && matchType
  })

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} transactions</p>
        </div>
        <button
          onClick={() => { setEditTx(undefined); setShowModal(true) }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Income</p>
          <p className="font-mono text-lg font-medium text-emerald-400">+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Expenses</p>
          <p className="font-mono text-lg font-medium text-red-400">-{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Net</p>
          <p className={`font-mono text-lg font-medium ${totalIncome - totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-white/5 border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="bg-white/5 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="bg-white/5 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
          {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-border">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-2 text-sm capitalize transition-all ${typeFilter === t ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">Description</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} className={`border-b border-border/50 hover:bg-white/3 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: (CATEGORY_COLORS[t.category] || '#94a3b8') + '20', color: CATEGORY_COLORS[t.category] || '#94a3b8' }}>
                        {t.category[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        {t.isRecurring && <span className="text-xs text-muted-foreground">Recurring</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: (CATEGORY_COLORS[t.category] || '#94a3b8') + '20', color: CATEGORY_COLORS[t.category] || '#94a3b8' }}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(t.date)}</td>
                  <td className={`px-5 py-3.5 text-right font-mono text-sm font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditTx(t); setShowModal(true) }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteTx(t.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <TransactionModal
          transaction={editTx}
          onClose={() => { setShowModal(false); setEditTx(undefined) }}
          onSuccess={() => { setShowModal(false); setEditTx(undefined); fetchTransactions() }}
        />
      )}
    </div>
  )
}
