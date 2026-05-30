'use client'

import type { PolicyRule } from '../../lib/types'
import { getSeverityStyles } from '../../lib/utils'

interface Props {
  rule: PolicyRule
  onToggle: (id: string, isActive: boolean) => void
}

export default function PolicyRuleCard({ rule, onToggle }: Props) {
  const sev = getSeverityStyles(rule.severity)

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 10,
      borderLeft: `3px solid ${sev.leftBorder}`,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
            {rule.title}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 500,
              background: 'var(--surface-3)', color: 'var(--text-tertiary)',
              borderRadius: 20, padding: '1px 8px',
              border: '0.5px solid var(--border-subtle)',
            }}>
              {rule.category}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 500,
              background: sev.bg, color: sev.text,
              borderRadius: 20, padding: '1px 8px',
              border: `0.5px solid ${sev.border}`,
            }}>
              {rule.severity}
            </span>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id, !rule.isActive)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: rule.isActive ? 'var(--sev-compliant-bg)' : 'var(--surface-3)',
            border: `0.5px solid ${rule.isActive ? 'var(--sev-compliant-text)' : 'var(--border-subtle)'}`,
            position: 'relative',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 200ms ease',
          }}
        >
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: rule.isActive ? 'var(--sev-compliant-text)' : 'var(--text-tertiary)',
            position: 'absolute',
            top: 2,
            left: rule.isActive ? 18 : 2,
            transition: 'left 200ms ease',
          }} />
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
        {rule.description}
      </p>

      {/* Threshold chip */}
      {rule.threshold !== undefined && (
        <div>
          <span style={{
            fontSize: 11, fontWeight: 500,
            background: 'var(--surface-3)', color: 'var(--text-secondary)',
            borderRadius: 20, padding: '2px 10px',
            border: '0.5px solid var(--border-subtle)',
          }}>
            Limit: {rule.threshold}{rule.thresholdUnit === '%' ? '%' : ` ${rule.thresholdUnit}`}
          </span>
        </div>
      )}

      {/* Source */}
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
        Source: {rule.extractedFrom}
      </div>
    </div>
  )
}
