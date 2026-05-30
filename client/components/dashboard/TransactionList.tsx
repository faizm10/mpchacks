'use client'

import { useState } from 'react'

const TRANSACTIONS = [
  {
    initials: 'MI',
    color: '#378ADD',
    name: 'MNA*MICHELIN CANADA',
    type: 'Parts Purchase',
    amount: '-$51,182.84',
    positive: false,
    date: 'Sep 3, 2025, 10:30 AM',
  },
  {
    initials: 'FJ',
    color: '#5DCAA5',
    name: "FLYING J (all locations)",
    type: 'Fuel',
    amount: '-$774.35',
    positive: false,
    date: 'Sep 2, 2025, 09:00 AM',
  },
  {
    initials: 'TX',
    color: '#7F77DD',
    name: 'TXDMV OS PERMIT TPE',
    type: 'Credit / Refund',
    amount: '+$1,240.00',
    positive: true,
    date: 'Aug 29, 2025, 02:15 PM',
  },
]

export default function TransactionList() {
  const [search, setSearch] = useState('')

  const filtered = TRANSACTIONS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border-subtle)',
        gap: 12,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}>
          Recent Transactions
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface-3)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 7,
            padding: '5px 10px',
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-tertiary)' }} />
              <path d="M11.5 11.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--text-tertiary)' }} />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name"
              style={{
                background: 'transparent', border: 'none',
                fontSize: 11, color: 'var(--text-primary)',
                width: 110, outline: 'none',
              }}
            />
          </div>
          {/* Add button */}
          <button style={{
            width: 26, height: 26,
            background: 'var(--surface-3)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            +
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: t.color + '22',
              border: `1px solid ${t.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, color: t.color,
              flexShrink: 0, letterSpacing: '0.02em',
            }}>
              {t.initials}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{t.type}</div>
            </div>
            {/* Amount */}
            <div className="num" style={{
              fontSize: 12, fontWeight: 500, flexShrink: 0,
              color: t.positive ? '#5DCAA5' : 'var(--text-primary)',
            }}>
              {t.amount}
            </div>
            {/* Date */}
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 120, textAlign: 'right' }}>
              {t.date}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
