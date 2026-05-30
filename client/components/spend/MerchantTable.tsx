'use client'

import { useState, useMemo } from 'react'
import type { SpendSummary } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

type SortKey = 'name' | 'amount' | 'count' | 'avg'
type SortDir = 'asc' | 'desc'

interface Props {
  merchants: SpendSummary['topMerchants']
}

export default function MerchantTable({ merchants }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('amount')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    const filtered = merchants.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    return [...filtered].sort((a, b) => {
      const avg = (m: typeof a) => m.count > 0 ? m.amount / m.count : 0
      const va = sortKey === 'name' ? a.name : sortKey === 'amount' ? a.amount : sortKey === 'count' ? a.count : avg(a)
      const vb = sortKey === 'name' ? b.name : sortKey === 'amount' ? b.amount : sortKey === 'count' ? b.count : avg(b)
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
  }, [merchants, search, sortKey, sortDir])

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border-subtle)' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search merchants…"
          style={{
            width: '100%',
            height: 28,
            background: 'var(--surface-3)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 6,
            padding: '0 10px',
            fontSize: 12,
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 260 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-2)', zIndex: 1 }}>
            <tr style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
              {([
                { key: 'name', label: 'Merchant' },
                { key: 'amount', label: 'Spend' },
                { key: 'count', label: 'Txns' },
              ] as { key: SortKey; label: string }[]).map(col => (
                <th
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  style={{
                    padding: '7px 10px',
                    fontSize: 10, fontWeight: 500,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: sortKey === col.key ? '#AFA9EC' : 'var(--text-tertiary)',
                    textAlign: col.key === 'name' ? 'left' : 'right',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {col.label}{arrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.name} style={{
                borderBottom: i < rows.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
                background: i % 2 === 1 ? 'var(--surface-3)' : 'transparent',
              }}>
                <td style={{ padding: '7px 10px', fontSize: 11, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </td>
                <td style={{ padding: '7px 10px', fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--text-primary)', textAlign: 'right' }}>
                  {formatCurrency(m.amount)}
                </td>
                <td style={{ padding: '7px 10px', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                  {m.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
