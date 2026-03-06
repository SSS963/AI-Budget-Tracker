'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, MONTHS, CURRENT_YEAR } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/types'
import { TrendingUp, TrendingDown, PiggyBank, BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/analytics?month=${month}&year=${year}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const tooltipStyle = {
    backgroundColor: '#1c1917',
    border: '1px solid #2d2926',
    borderRadius: '12px',
    color: '#f5f0e8',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading analytics...</div>
  )

  const { stats, categorySpending, dailyTrend, monthlyTrend } = data

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Insights into your spending patterns</p>
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Income', value: formatCurrency(stats.totalIncome), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Expenses', value: formatCurrency(stats.totalExpenses), icon: TrendingDown, color: 'text-red-400' },
          { label: 'Savings', value: formatCurrency(stats.netSavings), icon: PiggyBank, color: 'text-blue-400' },
          { label: 'Savings Rate', value: `${stats.savingsRate}%`, icon: BarChart3, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
            <p className={`font-mono text-xl font-medium ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 6-Month Trend */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-5">6-Month Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-5">Spending by Category</h2>
          {categorySpending.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No expense data</div>
          ) : (
            <div className="flex gap-6 items-center">
              <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="amount"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categorySpending.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} opacity={0.9} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        const total = categorySpending.reduce((s: number, c: any) => s + c.amount, 0)
                        const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0
                        return (
                          <div style={{
                            background: '#1c1917',
                            border: `1px solid ${d.color}40`,
                            borderRadius: 12,
                            padding: '10px 14px',
                            boxShadow: `0 4px 24px ${d.color}30`,
                            minWidth: 140,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                              <span style={{ color: '#f5f0e8', fontSize: 13, fontWeight: 600 }}>{d.category}</span>
                            </div>
                            <div style={{ color: d.color, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                              {formatCurrency(d.amount)}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{pct}% of total spending</div>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Total</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8', fontFamily: 'monospace' }}>
                    {formatCurrency(categorySpending.reduce((s: number, c: any) => s + c.amount, 0))}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-48 scrollbar-hide">
                {categorySpending.slice(0, 7).map((c: any) => {
                  const total = categorySpending.reduce((s: number, x: any) => s + x.amount, 0)
                  const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-xs text-muted-foreground">{c.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                          <span className="text-xs font-mono font-medium">{formatCurrency(c.amount)}</span>
                        </div>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Spending */}
        <div className="glass rounded-2xl p-6 col-span-2">
          <h2 className="font-semibold mb-5">Daily Spending This Month</h2>
          {dailyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={false} name="Expenses" />
                <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} dot={false} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Table */}
      {categorySpending.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Category Breakdown</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Budget</th>
                <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Usage</th>
              </tr>
            </thead>
            <tbody>
              {categorySpending.map((c: any, i: number) => {
                const pct = c.budget ? Math.min((c.amount / c.budget) * 100, 100) : null
                const isOver = c.budget && c.amount > c.budget
                return (
                  <tr key={c.category} className={`border-b border-border/50 ${i === categorySpending.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm">{c.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-sm text-red-400">{formatCurrency(c.amount)}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-sm text-muted-foreground">{c.budget ? formatCurrency(c.budget) : '—'}</td>
                    <td className="px-6 py-3.5 w-48">
                      {pct !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isOver ? '#f87171' : c.color }} />
                          </div>
                          <span className={`text-xs font-mono w-8 text-right ${isOver ? 'text-red-400' : 'text-muted-foreground'}`}>{Math.round(pct)}%</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">No budget</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
