'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, CheckCircle, GripVertical } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { formatCurrency } from '@/lib/utils'

const EXPENSE_CATEGORIES = CATEGORIES.filter(c => !['Salary', 'Freelance', 'Investment'].includes(c))
const PRIORITY_CATEGORIES = EXPENSE_CATEGORIES

interface FixedExpense {
  label: string
  category: string
  amount: number
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [savingsGoalPct, setSavingsGoalPct] = useState(20)
  const [lifestyleNote, setLifestyleNote] = useState('')
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { label: 'Rent', category: 'Housing', amount: 0 },
  ])
  const [priorities, setPriorities] = useState<string[]>(['Food & Dining', 'Transport', 'Entertainment'])
  const [newFixed, setNewFixed] = useState({ label: '', category: 'Housing', amount: '' })

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setMonthlyIncome(data.monthlyIncome > 0 ? data.monthlyIncome.toString() : '')
          setSavingsGoalPct(data.savingsGoalPct || 20)
          setLifestyleNote(data.lifestyleNote || '')
          setFixedExpenses((data.fixedExpenses as FixedExpense[]) || [])
          setPriorities((data.priorities as string[]) || [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function addFixed() {
    if (!newFixed.label || !newFixed.amount) return
    setFixedExpenses(prev => [...prev, { ...newFixed, amount: parseFloat(newFixed.amount) }])
    setNewFixed({ label: '', category: 'Housing', amount: '' })
  }

  function removeFixed(i: number) {
    setFixedExpenses(prev => prev.filter((_, idx) => idx !== i))
  }

  function togglePriority(cat: string) {
    setPriorities(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function movePriority(cat: string, dir: 'up' | 'down') {
    const idx = priorities.indexOf(cat)
    if (idx === -1) return
    const next = [...priorities]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setPriorities(next)
  }

  async function save() {
    const incomeValue = parseFloat(monthlyIncome)
    if (!incomeValue || incomeValue <= 0) {
      alert('Please enter your monthly income before saving.')
      return
    }
    setSaving(true)
    const payload = {
      monthlyIncome: incomeValue,
      fixedExpenses,
      priorities,
      savingsGoalPct,
      lifestyleNote,
    }
    console.log('[settings] saving payload:', JSON.stringify(payload))
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    console.log('[settings] save response:', JSON.stringify(data))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const fixedTotal = fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const income = parseFloat(monthlyIncome) || 0
  const savingsAmt = Math.round(income * (savingsGoalPct / 100))
  const budgetable = Math.max(0, income - fixedTotal - savingsAmt)

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading...</div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Help the AI understand your finances for smarter budget suggestions</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium px-4 py-2.5 rounded-xl text-sm transition-all"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : null}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Income */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">💰 Income</h2>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Monthly take-home income (after tax)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(e.target.value)}
              placeholder="2600"
              className="w-full bg-white/5 border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">
            Savings goal — <span className="text-emerald-400 font-mono">{savingsGoalPct}%</span>
            {income > 0 && <span className="text-muted-foreground"> = {formatCurrency(savingsAmt)}/mo</span>}
          </label>
          <input
            type="range"
            min="0"
            max="80"
            value={savingsGoalPct}
            onChange={e => setSavingsGoalPct(parseInt(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span><span>80%</span>
          </div>
        </div>
      </div>

      {/* Fixed Expenses */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold">📌 Fixed Monthly Commitments</h2>
          <p className="text-xs text-muted-foreground mt-1">Rent, investments, subscriptions — things you always pay</p>
        </div>

        <div className="space-y-2">
          {fixedExpenses.map((e, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">{e.category}</p>
              </div>
              <span className="font-mono text-sm text-red-400">-{formatCurrency(e.amount)}</span>
              <button onClick={() => removeFixed(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add fixed expense */}
        <div className="flex gap-2 flex-wrap">
          <input
            value={newFixed.label}
            onChange={e => setNewFixed(f => ({ ...f, label: e.target.value }))}
            placeholder="Label (e.g. Investments)"
            className="flex-1 min-w-32 bg-white/5 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
          />
          <select
            value={newFixed.category}
            onChange={e => setNewFixed(f => ({ ...f, category: e.target.value }))}
            className="bg-white/5 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={newFixed.amount}
              onChange={e => setNewFixed(f => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className="w-24 bg-white/5 border border-border rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>
          <button
            onClick={addFixed}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-border rounded-xl px-3 py-2 text-sm transition-all"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {/* Summary */}
        {income > 0 && (
          <div className="bg-white/3 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly income</span>
              <span className="font-mono text-emerald-400">+{formatCurrency(income)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fixed commitments</span>
              <span className="font-mono text-red-400">-{formatCurrency(fixedTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Savings ({savingsGoalPct}%)</span>
              <span className="font-mono text-blue-400">-{formatCurrency(savingsAmt)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-medium">
              <span>Available to budget</span>
              <span className={`font-mono ${budgetable > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(budgetable)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Spending Priorities */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-semibold">🎯 Spending Priorities</h2>
          <p className="text-xs text-muted-foreground mt-1">Select and rank the categories most important to your lifestyle. The AI will allocate more to higher-ranked ones.</p>
        </div>

        {/* Selected & ranked */}
        {priorities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Your priorities (drag to reorder):</p>
            {priorities.map((cat, i) => (
              <div key={cat} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                <span className="text-xs font-mono text-emerald-400 w-5">#{i + 1}</span>
                <span className="flex-1 text-sm">{cat}</span>
                <div className="flex gap-1">
                  <button onClick={() => movePriority(cat, 'up')} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors text-xs">↑</button>
                  <button onClick={() => movePriority(cat, 'down')} disabled={i === priorities.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors text-xs">↓</button>
                  <button onClick={() => togglePriority(cat)} className="p-1 text-muted-foreground hover:text-red-400 transition-colors ml-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category picker */}
        <div className="flex flex-wrap gap-2">
          {PRIORITY_CATEGORIES.filter(c => !priorities.includes(c)).map(cat => (
            <button
              key={cat}
              onClick={() => togglePriority(cat)}
              className="px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-border hover:border-white/20 text-muted-foreground hover:text-foreground transition-all"
            >
              + {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lifestyle Note */}
      <div className="glass rounded-2xl p-6 space-y-3">
        <div>
          <h2 className="font-semibold">📝 Lifestyle Context</h2>
          <p className="text-xs text-muted-foreground mt-1">Tell the AI about your lifestyle so it can give more personalized suggestions</p>
        </div>
        <textarea
          value={lifestyleNote}
          onChange={e => setLifestyleNote(e.target.value)}
          placeholder="e.g. Student in Singapore, eat out most days, commute by MRT, gym membership, no car..."
          rows={3}
          maxLength={500}
          className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{lifestyleNote.length}/500</p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium py-3 rounded-xl transition-all"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : null}
        {saved ? 'Profile Saved!' : saving ? 'Saving...' : 'Save Financial Profile'}
      </button>
    </div>
  )
}
