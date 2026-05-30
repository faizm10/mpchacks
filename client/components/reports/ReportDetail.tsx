'use client'

import { useState } from 'react'
import type { Trip } from '../../lib/types'
import { formatCurrency, formatDateRange, getPolicyStatusStyles } from '../../lib/utils'

interface Props {
  trip: Trip
}

export default function ReportDetail({ trip }: Props) {
  const [showToast, setShowToast] = useState<string | null>(null)
  const status = getPolicyStatusStyles(trip.policyStatus)

  const handleExport = () => {
    setShowToast('Export coming soon')
    setTimeout(() => setShowToast(null), 2000)
  }

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
          {trip.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>· Card {trip.cardNumber}</span>
          <span className="num" style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 'auto' }}>
            {formatCurrency(trip.totalSpend)}
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 500,
            background: status.bg, color: status.text,
            borderRadius: 20, padding: '2px 10px',
            border: `0.5px solid ${status.border}`,
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* AI Summary */}
      <div style={{
        background: 'var(--sev-approval-bg)',
        borderLeft: '3px solid #7F77DD',
        borderRadius: '0 8px 8px 0',
        padding: '10px 12px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#AFA9EC', marginBottom: 6 }}>
          AI Summary
        </div>
        <p style={{ fontSize: 12, color: '#AFA9EC', lineHeight: 1.65, fontStyle: 'italic' }}>
          {trip.aiSummary}
        </p>
      </div>

      {/* Category breakdown */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
          Spend breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {trip.categoryBreakdown.map(cat => (
            <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: getCatColor(cat.category), flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cat.category}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cat.percentage}%</span>
                <span className="num" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trip info */}
      <div style={{
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 16,
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.65,
      }}>
        <div><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>From:</strong> {trip.startLocation}</div>
        <div><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>To:</strong> {trip.endLocation}</div>
        <div><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Transactions:</strong> {trip.transactionCount}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8,
            background: 'var(--sev-approval-bg)', color: '#AFA9EC',
            border: '0.5px solid var(--border-subtle)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Send to CFO
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8,
            background: 'var(--surface-3)', color: 'var(--text-secondary)',
            border: '0.5px solid var(--border-subtle)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            position: 'relative',
          }}
        >
          {showToast ? showToast : 'Export PDF'}
        </button>
      </div>
    </div>
  )
}

function getCatColor(category: string): string {
  const colors: Record<string, string> = {
    'Fuel': '#378ADD',
    'Permits': '#BA7517',
    'Tires / Parts': '#7F77DD',
    'Lodging': '#1D9E75',
    'Other': '#555',
  }
  return colors[category] ?? '#555'
}
