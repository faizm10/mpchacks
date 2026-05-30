'use client'

import type { Trip } from '../../lib/types'
import { formatCurrency, formatDateRange, getPolicyStatusStyles } from '../../lib/utils'

interface Props {
  trip: Trip
  isSelected: boolean
  onClick: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'Fuel':        '#378ADD',
  'Permits':     '#BA7517',
  'Tires / Parts': '#7F77DD',
  'Lodging':     '#1D9E75',
  'Other':       '#555',
}

export default function ReportCard({ trip, isSelected, onClick }: Props) {
  const status = getPolicyStatusStyles(trip.policyStatus)

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
        border: '0.5px solid',
        borderColor: isSelected ? 'var(--border-accent)' : 'var(--border-subtle)',
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {/* Title + amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, marginRight: 10 }}>
          {trip.name}
        </span>
        <span className="num" style={{ fontSize: 13, color: 'var(--text-primary)', flexShrink: 0 }}>
          {formatCurrency(trip.totalSpend)}
        </span>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {formatDateRange(trip.startDate, trip.endDate)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{trip.transactionCount} transactions</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Card {trip.cardNumber}</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11, fontWeight: 500,
          background: status.bg, color: status.text,
          borderRadius: 20, padding: '1px 8px',
          border: `0.5px solid ${status.border}`,
          flexShrink: 0,
        }}>
          {status.label}
        </span>
      </div>

      {/* Stacked category bar */}
      <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
        {trip.categoryBreakdown.map(cat => (
          <div
            key={cat.category}
            style={{
              width: `${cat.percentage}%`,
              background: CATEGORY_COLORS[cat.category] ?? '#555',
              height: '100%',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
        {trip.categoryBreakdown.map(cat => (
          <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 1, background: CATEGORY_COLORS[cat.category] ?? '#555', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{cat.category} {cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
