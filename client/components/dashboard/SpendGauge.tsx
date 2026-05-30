'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const SEGMENTS = [
  { label: 'Fuel', pct: 58, color: '#378ADD' },
  { label: 'Permits', pct: 30, color: '#7F77DD' },
  { label: 'Repairs', pct: 8, color: '#5DCAA5' },
  { label: 'Other', pct: 4, color: '#555' },
]

export default function SpendGauge() {
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
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Spend Breakdown</span>
        <button style={{ fontSize: 16, color: 'var(--text-tertiary)', lineHeight: 1 }}>···</button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '8px 16px 16px', gap: 12 }}>
        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {SEGMENTS.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: s.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }} className="num">
                {s.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* Half-donut gauge */}
        <div style={{ position: 'relative', width: 140, height: 80, flexShrink: 0 }}>
          <ResponsiveContainer width={140} height={160}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={SEGMENTS}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={52}
                outerRadius={68}
                dataKey="pct"
                strokeWidth={0}
                paddingAngle={2}
              >
                {SEGMENTS.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div className="num" style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              4,235
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 1, whiteSpace: 'nowrap' }}>
              Total txns
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
