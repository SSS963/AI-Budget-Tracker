'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, ChevronDown, ChevronUp, AlertCircle, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/types'
import Link from 'next/link'

interface Allocation {
  category: string
  amount: number
  insight: string
}

interface AdvisorResult {
  summary: string
  allocations: Allocation[]
  meta: {
    monthlyIncome: number
    fixedTotal: number
    savingsTarget: number
    budgetableAmount: number
    savingsGoalPct: number
  }
}

interface Props {
  month: number
  year: number
  onApply: () => void
}

export function AIBudgetAdvisor({ month, year, onApply }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdvisorResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [expanded, setExpanded] = useState(true)

  async function generate() {
    setLoading(true)
    setError(null)
    setResult(null)
    setApplied(false)
    try {
      const res = await fetch('/api/ai-advisor', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate')
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function applyAll() {
    if (!result) return
    setApplying(true)
    await Promise.all(
      result.allocations.map(a =>
        fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: a.category, limit: a.amount, month, year }),
        })
      )
    )
    setApplied(true)
    setApplying(false)
    onApply()
  }

  return (
    <div className="glass rounded-2xl overflow-hidden border border-emerald-500/20">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-emerald-500/5 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Budget Advisor</h2>
            <p className="text-xs text-muted-foreground">Personalized allocation based on your profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-medium px-3 py-2 rounded-xl text-xs transition-all"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {loading ? 'Analyzing...' : result ? 'Regenerate' : 'Generate Suggestions'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400">{error}</p>
            {error.includes('profile') && (
              <Link href="/dashboard/settings" className="text-xs text-emerald-400 hover:underline mt-1 flex items-center gap-1">
                Complete your profile <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="px-6 py-8 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={24} className="animate-spin text-emerald-400" />
          <p className="text-sm">Analyzing your income, spending history, and priorities...</p>
        </div>
      )}

      {/* Results */}
      {result && expanded && (
        <div className="p-6 space-y-5">
          {/* Income breakdown */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Income', value: result.meta.monthlyIncome, color: 'text-emerald-400' },
              { label: 'Fixed', value: result.meta.fixedTotal, color: 'text-red-400' },
              { label: 'Savings', value: result.meta.savingsTarget, color: 'text-blue-400' },
              { label: 'To Budget', value: result.meta.budgetableAmount, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/3 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`font-mono text-sm font-medium ${s.color}`}>{formatCurrency(s.value)}</p>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
            <p className="text-xs text-emerald-400 font-medium mb-1.5">💡 Strategy</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
          </div>

          {/* Allocations */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Suggested Allocations</p>
            {result.allocations.map((a) => {
              const color = CATEGORY_COLORS[a.category] || '#94a3b8'
              const pct = result.meta.budgetableAmount > 0
                ? Math.round((a.amount / result.meta.budgetableAmount) * 100)
                : 0
              return (
                <div key={a.category} className="flex items-start gap-4 bg-white/3 rounded-xl p-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: color + '20', color }}>
                    {a.category[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{a.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                        <span className="font-mono text-sm font-medium">{formatCurrency(a.amount)}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{a.insight}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total check */}
          <div className="flex items-center justify-between text-sm border-t border-border pt-4">
            <span className="text-muted-foreground">Total allocated</span>
            <span className="font-mono font-medium">
              {formatCurrency(result.allocations.reduce((s, a) => s + a.amount, 0))}
              <span className="text-muted-foreground text-xs ml-2">of {formatCurrency(result.meta.budgetableAmount)}</span>
            </span>
          </div>

          {/* Apply button */}
          <button
            onClick={applyAll}
            disabled={applying || applied}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 text-black font-medium py-2.5 rounded-xl text-sm transition-all"
          >
            {applying ? <Loader2 size={15} className="animate-spin" /> : applied ? <CheckCircle size={15} /> : <Sparkles size={15} />}
            {applied ? 'Budgets Applied!' : applying ? 'Applying...' : `Apply All ${result.allocations.length} Budgets for ${month}/${year}`}
          </button>

          {applied && (
            <p className="text-xs text-center text-emerald-400">
              ✓ All budgets have been set. You can edit them individually below.
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="px-6 py-6 text-center text-muted-foreground">
          <p className="text-sm">Click "Generate Suggestions" to get a personalized budget allocation based on your income and spending history.</p>
          <Link href="/dashboard/settings" className="text-xs text-emerald-400 hover:underline mt-2 inline-flex items-center gap-1">
            Set up your financial profile first <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  )
}
