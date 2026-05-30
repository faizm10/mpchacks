'use client'

import { X } from 'lucide-react'
import type { InboxItem, Violation, ApprovalRequest } from '../../lib/types'
import { formatCurrency, formatDate, getSeverityStyles, getViolationTypeLabel } from '../../lib/utils'

interface DetailPanelProps {
  item: InboxItem
  onClose: () => void
  onResolve: (id: string, action: string) => void
}

export default function DetailPanel({ item, onClose, onResolve }: DetailPanelProps) {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-1)',
      overflow: 'hidden',
    }}>
      {item.type === 'violation' && item.violation
        ? <ViolationDetail item={item} violation={item.violation} onClose={onClose} onResolve={onResolve} />
        : item.type === 'approval' && item.approval
        ? <ApprovalDetail item={item} approval={item.approval} onClose={onClose} onResolve={onResolve} />
        : null}
    </div>
  )
}

function ViolationDetail({
  item, violation, onClose, onResolve,
}: { item: InboxItem; violation: Violation; onClose: () => void; onResolve: (id: string, action: string) => void }) {
  const sev = item.severity ? getSeverityStyles(item.severity) : null
  const allTx = [violation.transaction, ...(violation.relatedTransactions ?? [])]

  return (
    <>
      <Header onClose={onClose}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="num" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {formatCurrency(item.amount)}
          </span>
          {sev && item.severity && (
            <Badge bg={sev.bg} color={sev.text} border={sev.border}>
              {item.severity} severity
            </Badge>
          )}
        </div>
      </Header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
        <Section title="What happened">
          <Tinted bg={sev?.bg} border={sev?.border}>
            <p style={{ fontSize: 13, color: sev?.text ?? 'var(--text-secondary)', lineHeight: 1.65 }}>
              {violation.reason}
            </p>
          </Tinted>
        </Section>

        <Section title="Policy violated">
          <Tinted>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 6 }}>
              {violation.policyRule}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Source: {violation.type === 'split_charge'
                ? 'Business Expenses — General Policy'
                : violation.type === 'personal_expense'
                ? 'Corporate Credit Cards'
                : 'Business Expenses — General Policy'}
            </p>
          </Tinted>
        </Section>

        <Section title={`Transactions (${allTx.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {allTx.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--surface-2)',
                borderRadius: 6,
                border: '0.5px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{tx.merchantName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {formatDate(tx.transactionDate)}{tx.city ? ` · ${tx.city}` : ''}{tx.state ? `, ${tx.state}` : ''}
                  </div>
                </div>
                <span className="num" style={{ fontSize: 12, color: 'var(--text-primary)', flexShrink: 0 }}>
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Violation type">
          <span style={{
            fontSize: 12, fontWeight: 500,
            background: 'var(--surface-2)', color: 'var(--text-secondary)',
            borderRadius: 20, padding: '4px 12px',
            border: '0.5px solid var(--border-subtle)',
            display: 'inline-block',
          }}>
            {getViolationTypeLabel(violation.type)}
          </span>
        </Section>

        <div style={{ height: 72 }} />
      </div>

      <Actions>
        <ActionButton onClick={() => onResolve(item.id, 'reject')} variant="coral">Reject expense</ActionButton>
        <ActionButton onClick={() => onResolve(item.id, 'legitimate')} variant="teal">Mark as legitimate</ActionButton>
      </Actions>
    </>
  )
}

function ApprovalDetail({
  item, approval, onClose, onResolve,
}: { item: InboxItem; approval: ApprovalRequest; onClose: () => void; onResolve: (id: string, action: string) => void }) {
  const rec = {
    approve: { bg: 'var(--sev-compliant-bg)', text: 'var(--sev-compliant-text)', label: 'Recommend: Approve' },
    deny:    { bg: 'var(--sev-high-bg)', text: 'var(--sev-high-text)', label: 'Recommend: Deny' },
    review:  { bg: 'var(--sev-med-bg)', text: 'var(--sev-med-text)', label: 'Recommend: Review' },
  }[approval.aiRecommendation]

  const { used, total, remaining, period } = approval.departmentBudget
  const pct = Math.round((used / total) * 100)
  const barColor = pct > 85 ? '#D85A30' : pct > 70 ? '#BA7517' : '#1D9E75'

  return (
    <>
      <Header onClose={onClose}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="num" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {formatCurrency(item.amount)}
          </span>
          <Badge bg="var(--sev-approval-bg)" color="var(--sev-approval-text)" border="var(--border-subtle)">
            Pending approval
          </Badge>
        </div>
      </Header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
        <Section title="AI recommendation">
          <Tinted bg={rec.bg}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: rec.text, marginBottom: 6 }}>
              {rec.label}
            </div>
            <p style={{ fontSize: 13, color: rec.text, lineHeight: 1.65 }}>
              {approval.aiReasoning}
            </p>
          </Tinted>
        </Section>

        <Section title="Budget status">
          <Tinted>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{period}</span>
              <span className="num" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                {formatCurrency(remaining)} remaining
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 600ms ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {formatCurrency(used)} used of {formatCurrency(total)}
            </div>
          </Tinted>
        </Section>

        {approval.employeeHistory.length > 0 && (
          <Section title="Recent card activity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {approval.employeeHistory.slice(0, 5).map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: 'var(--surface-2)', borderRadius: 6,
                  border: '0.5px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{tx.merchantName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {formatDate(tx.transactionDate)}{tx.city ? ` · ${tx.city}` : ''}
                    </div>
                  </div>
                  <span className="num" style={{ fontSize: 11, color: 'var(--text-primary)', flexShrink: 0 }}>
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div style={{ height: 72 }} />
      </div>

      <Actions>
        <ActionButton onClick={() => onResolve(item.id, 'approve')} variant="teal">Approve</ActionButton>
        <ActionButton onClick={() => onResolve(item.id, 'deny')} variant="coral">Deny</ActionButton>
      </Actions>
    </>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function Header({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      padding: '14px 16px 12px',
      borderBottom: '0.5px solid var(--border-subtle)',
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button
        onClick={onClose}
        style={{ color: 'var(--text-tertiary)', padding: 4, borderRadius: 4, flexShrink: 0, marginTop: 2 }}
      >
        <X size={15} />
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 500, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 7,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Tinted({ bg, border, children }: { bg?: string; border?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: bg ?? 'var(--surface-2)',
      border: `0.5px solid ${border ?? 'var(--border-subtle)'}`,
      borderRadius: 8, padding: '10px 12px',
    }}>
      {children}
    </div>
  )
}

function Badge({ bg, color, border, children }: { bg: string; color: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      background: bg, color,
      borderRadius: 20, padding: '2px 10px',
      border: `0.5px solid ${border}`,
    }}>
      {children}
    </span>
  )
}

function Actions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '0.5px solid var(--border-subtle)',
      display: 'flex', gap: 8, flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

function ActionButton({ onClick, variant, children }: {
  onClick: () => void
  variant: 'teal' | 'coral'
  children: React.ReactNode
}) {
  const s = variant === 'teal'
    ? { bg: 'var(--sev-compliant-bg)', color: 'var(--sev-compliant-text)' }
    : { bg: 'var(--sev-high-bg)', color: 'var(--sev-high-text)' }

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '9px 0', borderRadius: 8,
        background: s.bg, color: s.color,
        border: '0.5px solid var(--border-subtle)',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
