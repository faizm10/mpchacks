'use client'

import type { SpendSummary } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

interface Props {
  summary: SpendSummary
}

export default function KPIGrid({ summary }: Props) {
  const stats = [
    { label: 'Total spend', value: formatCurrency(summary.totalSpend), accent: false },
    { label: 'Transactions', value: summary.transactionCount.toLocaleString('en-CA'), accent: false },
    { label: 'Avg transaction', value: formatCurrency(summary.avgTransaction), accent: false },
    { label: 'Open violations', value: String(summary.openViolations), accent: true },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'var(--surface-2)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>
            {s.label}
          </div>
          <div className="num" style={{
            fontSize: 22, fontWeight: 500,
            color: s.accent ? 'var(--sev-high-text)' : 'var(--text-primary)',
            lineHeight: 1.2,
          }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
