'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

interface Props {
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction
}

export function TransactionModal({ onClose, onSuccess, transaction }: Props) {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || '',
    type: transaction?.type || 'expense',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isRecurring: transaction?.isRecurring || false,
  })

  async function autoCategorize() {
    if (!form.description || !form.amount) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: form.description, amount: parseFloat(form.amount) }),
      })
      const { category } = await res.json()
      setForm(f => ({ ...f, category }))
    } catch {}
    setAiLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions'
      const method = transaction ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (res.ok) onSuccess()
    } catch {}
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">{transaction ? 'Edit' : 'Add'} Transaction</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 text-sm font-medium transition-all capitalize ${form.type === t ? t === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
            <div className="flex gap-2">
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Grab ride to airport"
                className="flex-1 bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
              <button
                type="button"
                onClick={autoCategorize}
                title="Auto-categorize with AI"
                disabled={aiLoading || !form.description}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-border rounded-xl transition-all disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin text-emerald-400" /> : <Sparkles size={16} className="text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className="text-sm text-muted-foreground">Recurring transaction</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {transaction ? 'Update' : 'Add'} Transaction
          </button>
        </form>
      </div>
    </div>
  )
}
