'use client'

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { SpendSummary } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

type Tab = 'category' | 'time' | 'merchants' | 'card'

interface Props {
  summary: SpendSummary
  activeTab: Tab
  onTabChange: (t: Tab) => void
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'category', label: 'By category' },
  { key: 'time', label: 'Over time' },
  { key: 'merchants', label: 'Top merchants' },
  { key: 'card', label: 'By card' },
]

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface-1)',
    border: '0.5px solid oklch(1 0 0 / 10%)',
    borderRadius: 6,
    fontSize: 12,
    color: 'oklch(0.95 0 0)',
  },
  labelStyle: { color: 'oklch(0.65 0 0)' },
  cursor: { fill: 'oklch(1 0 0 / 4%)' },
}

const axisStyle = {
  tick: { fontSize: 10, fill: 'oklch(0.40 0 0)' },
  axisLine: false as const,
  tickLine: false as const,
}

export default function SpendChart({ summary, activeTab, onTabChange }: Props) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border-subtle)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 500,
              color: activeTab === t.key ? '#AFA9EC' : 'var(--text-tertiary)',
              borderBottom: activeTab === t.key ? '2px solid #7F77DD' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 12px' }}>
        {activeTab === 'category' && (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={summary.categoryBreakdown.map(c => ({ name: c.category, value: c.amount, color: c.color }))} layout="vertical" margin={{ left: 70, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" {...axisStyle} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" {...axisStyle} width={70} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {summary.categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'time' && (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={summary.monthlyTrend} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
              <XAxis dataKey="month" {...axisStyle} />
              <YAxis {...axisStyle} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={46} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="amount" stroke="#7F77DD" strokeWidth={2} dot={{ fill: '#7F77DD', r: 3, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'merchants' && (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[...summary.topMerchants].sort((a, b) => b.amount - a.amount).map(m => ({ name: m.name.length > 18 ? m.name.slice(0, 18) + '…' : m.name, value: m.amount }))} layout="vertical" margin={{ left: 110, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" {...axisStyle} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" {...axisStyle} width={110} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="value" fill="#378ADD" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'card' && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[{ name: 'Card 3001', value: 2717509.64 }]} margin={{ left: 12, right: 12, top: 4, bottom: 4 }}>
                <XAxis dataKey="name" {...axisStyle} />
                <YAxis {...axisStyle} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} width={50} />
                <Tooltip {...tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Bar dataKey="value" fill="#7F77DD" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
