'use client'

import { Info } from 'lucide-react'
import PolicyRuleCard from '../../components/policy/PolicyRuleCard'
import { usePolicy } from '../../hooks/usePolicy'

export default function PolicyPage() {
  const { rules, isLoading, toggleRule } = usePolicy()

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 20px' }}>
      {/* Info banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--sev-low-bg)',
        border: '0.5px solid var(--sev-low-accent)',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 12,
        color: 'var(--sev-low-text)',
      }}>
        <Info size={14} />
        <span>
          Policy rules extracted by <strong style={{ fontWeight: 500 }}>Gemini</strong> from{' '}
          <span style={{ fontStyle: 'italic' }}>Brim_Expense_Policy.pdf</span>
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {rules.map(rule => (
            <PolicyRuleCard key={rule.id} rule={rule} onToggle={toggleRule} />
          ))}
        </div>
      )}
    </div>
  )
}
