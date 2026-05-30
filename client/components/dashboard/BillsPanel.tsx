'use client'

const BILLS = [
  {
    icon: '🚛',
    name: 'TXDMV OS Permit',
    date: 'May 15, 2026',
    amount: '$480.00',
  },
  {
    icon: '🔧',
    name: 'Michelin Canada',
    date: 'May 22, 2026',
    amount: '$2,840.00',
  },
]

export default function BillsPanel() {
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Upcoming Expenses</span>
        <button style={{ fontSize: 16, color: 'var(--text-tertiary)', lineHeight: 1 }}>···</button>
      </div>

      <div style={{ flex: 1 }}>
        {BILLS.map((b, i) => (
          <div key={i} style={{
            padding: '14px 16px',
            borderBottom: i < BILLS.length - 1 ? '0.5px solid var(--border-subtle)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                {b.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{b.date}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 44 }}>
              <span className="num" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{b.amount}</span>
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: 'var(--text-tertiary)',
                background: 'var(--surface-3)',
                borderRadius: 20, padding: '2px 9px',
              }}>
                Scheduled
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px' }}>
        <button style={{
          width: '100%', padding: '9px',
          background: 'var(--surface-3)',
          border: '0.5px solid var(--border-default)',
          borderRadius: 8,
          fontSize: 12, fontWeight: 500,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}>
          View All
        </button>
      </div>
    </div>
  )
}
