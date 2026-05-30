'use client'

const CARDS = [
  { label: 'Total Spend', value: '$2.72M', change: '+7.78%', positive: true },
  { label: 'Fleet Balance', value: '$125,678', change: '+2.15%', positive: true },
  { label: 'Open Violations', value: '6', change: '-0.50%', positive: false },
  { label: 'Pending Approvals', value: '2', change: '+12.40%', positive: true },
]

export default function KPICards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {CARDS.map(c => (
        <div key={c.label} style={{
          background: 'var(--surface-2)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>{c.label}</span>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--text-tertiary)',
            }}>$</div>
          </div>
          <div className="num" style={{
            fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em',
            color: 'var(--text-primary)', marginBottom: 6,
          }}>
            {c.value}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: c.positive ? '#5DCAA5' : '#F0997B',
          }}>
            {c.change}
          </span>
        </div>
      ))}
    </div>
  )
}
