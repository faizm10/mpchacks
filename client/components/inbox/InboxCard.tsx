'use client'

import type { InboxItem, ViolationType, Severity } from '../../lib/types'
import { formatCurrency, formatDate, getSeverityStyles, getViolationTypeLabel } from '../../lib/utils'

interface InboxCardProps {
  item: InboxItem
  isSelected: boolean
  onClick: () => void
}

export default function InboxCard({ item, isSelected, onClick }: InboxCardProps) {
  const isViolation = item.type === 'violation'
  const isApproval = item.type === 'approval'
  const sevStyles = item.severity ? getSeverityStyles(item.severity) : null
  const leftBorder = sevStyles?.leftBorder ?? '#7F77DD'

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
        border: '0.5px solid',
        borderColor: isSelected ? 'var(--border-accent)' : 'var(--border-subtle)',
        borderRadius: '0 10px 10px 0',
        borderLeft: `3px solid ${leftBorder}`,
        padding: '11px 14px',
        cursor: 'pointer',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
    >
      {/* Unread dot */}
      {!item.isRead && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#7F77DD',
        }} />
      )}

      {/* Merchant + amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5, paddingRight: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {item.title}
        </span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', color: 'var(--text-primary)', flexShrink: 0, marginLeft: 10 }}>
          {formatCurrency(item.amount)}
        </span>
      </div>

      {/* Badges + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        {isViolation && item.violation && (
          <ViolationBadge type={item.violation.type} severity={item.severity} />
        )}
        {isApproval && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            background: 'var(--sev-approval-bg)', color: 'var(--sev-approval-text)',
            borderRadius: 20, padding: '1px 8px',
            border: '0.5px solid var(--border-subtle)',
          }}>
            Approval needed
          </span>
        )}
        {item.cardNumber && (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Card {item.cardNumber}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          {formatDate(item.date)}
        </span>
      </div>

      {/* AI brief */}
      <div style={{
        fontSize: 12,
        color: 'var(--text-tertiary)',
        lineHeight: 1.55,
        fontStyle: 'italic',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        marginBottom: 9,
      } as React.CSSProperties}>
        {item.aiBrief}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
        {isViolation && (
          <>
            <ActionBtn label="Investigate" variant="neutral" />
            <ActionBtn label="Reject" variant="coral" />
            <ActionBtn label="Mark legitimate" variant="teal" />
          </>
        )}
        {isApproval && (
          <>
            <ActionBtn label="Approve" variant="teal" />
            <ActionBtn label="Deny" variant="coral" />
          </>
        )}
      </div>
    </div>
  )
}

function ViolationBadge({ type, severity }: { type: ViolationType; severity?: Severity }) {
  let bg = 'var(--surface-3)'
  let color = 'var(--text-secondary)'
  if (severity === 'high') { bg = 'var(--sev-high-bg)'; color = 'var(--sev-high-text)' }
  else if (severity === 'medium') { bg = 'var(--sev-med-bg)'; color = 'var(--sev-med-text)' }
  else if (severity === 'low') { bg = 'var(--sev-low-bg)'; color = 'var(--sev-low-text)' }

  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      background: bg, color,
      borderRadius: 20, padding: '1px 8px',
      border: '0.5px solid var(--border-subtle)',
    }}>
      {getViolationTypeLabel(type)}
    </span>
  )
}

function ActionBtn({ label, variant }: { label: string; variant: 'neutral' | 'coral' | 'teal' }) {
  const s = {
    neutral: { bg: 'var(--surface-3)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' },
    coral:   { bg: 'var(--sev-high-bg)', color: 'var(--sev-high-text)', border: 'var(--border-subtle)' },
    teal:    { bg: 'var(--sev-compliant-bg)', color: 'var(--sev-compliant-text)', border: 'var(--border-subtle)' },
  }[variant]

  return (
    <button style={{
      fontSize: 11, fontWeight: 500,
      padding: '3px 11px',
      borderRadius: 20,
      border: `0.5px solid ${s.border}`,
      background: s.bg,
      color: s.color,
      cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}
