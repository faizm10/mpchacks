'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import InboxCard from './InboxCard'
import type { InboxItem } from '../../lib/types'

type FilterType = 'all' | 'violations' | 'approvals' | 'resolved'

interface InboxFeedProps {
  items: InboxItem[]
  selectedItemId?: string
  onItemSelect: (item: InboxItem | null) => void
  filter: FilterType
  onFilterChange: (f: FilterType) => void
  isLoading: boolean
}

const FILTERS: FilterType[] = ['all', 'violations', 'approvals', 'resolved']

export default function InboxFeed({ items, selectedItemId, onItemSelect, filter, onFilterChange, isLoading }: InboxFeedProps) {
  const filtered = useMemo(() => {
    switch (filter) {
      case 'violations': return items.filter(i => i.type === 'violation' && !i.isResolved)
      case 'approvals': return items.filter(i => i.type === 'approval' && !i.isResolved)
      case 'resolved': return items.filter(i => i.isResolved)
      default: return items.filter(i => !i.isResolved)
    }
  }, [items, filter])

  const unread = items.filter(i => !i.isRead && !i.isResolved).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '0.5px solid var(--border-subtle)',
        flexShrink: 0,
        background: 'var(--surface-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Inbox</span>
          {unread > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 500,
              background: '#D85A30', color: 'white',
              borderRadius: 20, padding: '1px 9px',
            }}>
              {unread} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              style={{
                fontSize: 11, fontWeight: 500,
                padding: '3px 12px',
                borderRadius: 20,
                border: '0.5px solid',
                borderColor: filter === f ? '#7F77DD' : 'var(--border-subtle)',
                background: filter === f ? 'var(--sev-approval-bg)' : 'transparent',
                color: filter === f ? '#AFA9EC' : 'var(--text-tertiary)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10, color: 'var(--sev-compliant-text)' }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>You're all caught up</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>No items in this view</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <InboxCard
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onClick={() => onItemSelect(item)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
