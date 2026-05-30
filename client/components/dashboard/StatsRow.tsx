'use client'

import { useState } from 'react'

const BARS = [0.4, 0.7, 1.0, 0.6, 0.85, 0.5]

const KEY_STATS = [
  { label: 'Active Cards', value: '1' },
  { label: 'Transactions', value: '4,235' },
  { label: 'Avg Txn', value: '$641.68' },
]

export default function StatsRow() {
  const [cadAmount, setCadAmount] = useState('10,120')

  const numericCad = parseFloat(cadAmount.replace(/,/g, '')) || 0
  const usd = (numericCad * 0.74).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      {/* Card Balance */}
      <div style={{
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Card Balance</span>
          <span style={{
            fontSize: 9, fontWeight: 500,
            background: 'var(--sev-compliant-bg, oklch(0.10 0.04 165))',
            color: '#5DCAA5',
            borderRadius: 4, padding: '2px 7px',
          }}>
            Available to Spend
          </span>
        </div>
        <div className="num" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 10 }}>
          $21,548.56
        </div>
        {/* Mini bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
          {BARS.map((h, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${h * 100}%`,
              background: i === 2 ? '#7F77DD' : 'oklch(1 0 0 / 8%)',
              borderRadius: 2,
              transition: 'height 300ms ease',
            }} />
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div style={{
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>Key Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {KEY_STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
              <div className="num" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CAD / USD Converter */}
      <div style={{
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CAD to USD</span>
          <span className="num" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>≈ 0.7400</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '0.04em' }}>CAD</div>
            <input
              value={cadAmount}
              onChange={e => setCadAmount(e.target.value)}
              style={{
                width: '100%', background: 'var(--surface-3)',
                border: '0.5px solid var(--border-default)',
                borderRadius: 6, padding: '6px 8px',
                fontSize: 13, fontWeight: 500,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono), monospace',
              }}
            />
          </div>
          {/* Swap icon */}
          <div style={{
            width: 26, height: 26,
            background: 'var(--surface-3)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'var(--text-tertiary)',
            marginTop: 14, flexShrink: 0, cursor: 'pointer',
          }}>
            ⇄
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '0.04em' }}>USD</div>
            <div className="num" style={{
              width: '100%', background: 'var(--surface-3)',
              border: '0.5px solid var(--border-default)',
              borderRadius: 6, padding: '6px 8px',
              fontSize: 13, fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {usd}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
