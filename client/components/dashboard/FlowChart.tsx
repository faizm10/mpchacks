'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Tab = 'Fuel' | 'Permits' | 'Repairs'

const DATA: Record<Tab, { week: string; value: number }[]> = {
  Fuel: [
    { week: 'W1', value: 62400 },
    { week: 'W2', value: 74200 },
    { week: 'W3', value: 89100 },
    { week: 'W4', value: 71800 },
    { week: 'W5', value: 68900 },
    { week: 'W6', value: 76300 },
  ],
  Permits: [
    { week: 'W1', value: 18200 },
    { week: 'W2', value: 22500 },
    { week: 'W3', value: 26100 },
    { week: 'W4', value: 20800 },
    { week: 'W5', value: 19400 },
    { week: 'W6', value: 21200 },
  ],
  Repairs: [
    { week: 'W1', value: 8100 },
    { week: 'W2', value: 12400 },
    { week: 'W3', value: 9800 },
    { week: 'W4', value: 15200 },
    { week: 'W5', value: 11600 },
    { week: 'W6', value: 13400 },
  ],
}

function ArchBar(props: {
  x?: number; y?: number; width?: number; height?: number
  fill?: string; index?: number; maxIndex: number
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill = 'transparent', index = 0, maxIndex } = props
  if (!height || height <= 0) return null
  const cx = x + width / 2
  const d = [
    `M ${x} ${y + height}`,
    `C ${x} ${y + height * 0.15}, ${x} ${y}, ${cx} ${y}`,
    `C ${x + width} ${y}, ${x + width} ${y + height * 0.15}, ${x + width} ${y + height}`,
    'Z',
  ].join(' ')
  return (
    <g>
      <path d={d} fill={fill} />
      <circle
        cx={cx}
        cy={y - 5}
        r={index === maxIndex ? 6 : 4}
        fill={index === maxIndex ? '#7F77DD' : 'oklch(0.55 0.05 280)'}
        stroke="var(--surface-2)"
        strokeWidth={2}
      />
    </g>
  )
}

export default function FlowChart() {
  const [tab, setTab] = useState<Tab>('Fuel')
  const data = DATA[tab]
  const maxIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)
  const total = data.reduce((s, d) => s + d.value, 0)

  const renderBar = (props: any) => (
    <ArchBar
      {...props}
      maxIndex={maxIndex}
    />
  )

  return (
    <div style={{
      background: 'linear-gradient(150deg, oklch(0.18 0.04 280) 0%, var(--surface-2) 55%)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '0.04em' }}>
              Spend Flow
            </div>
            <div className="num" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              ${(total / 1000).toFixed(2)}k
            </div>
          </div>
          <button style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
            Weekly <span style={{ opacity: 0.6 }}>›</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginTop: 14, borderBottom: '0.5px solid var(--border-subtle)' }}>
          {(['Fuel', 'Permits', 'Repairs'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px',
                fontSize: 12, fontWeight: 500,
                color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: tab === t ? 'var(--surface-3)' : 'transparent',
                borderRadius: '6px 6px 0 0',
                marginBottom: -1,
                borderBottom: tab === t ? '2px solid #7F77DD' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {t}
            </button>
          ))}
          {/* Sparkline icon placeholder */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 4 }}>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>↗</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, padding: '4px 8px 8px', minHeight: 160 }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={160}>
          <BarChart
            data={data}
            barSize={46}
            margin={{ left: 0, right: 0, top: 18, bottom: 0 }}
          >
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'oklch(0.40 0 0)' }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-1)',
                border: '0.5px solid oklch(1 0 0 / 10%)',
                borderRadius: 6,
                fontSize: 11,
                color: 'oklch(0.95 0 0)',
              }}
              formatter={(v) => [`$${(Number(v) / 1000).toFixed(1)}k`, tab]}
              labelStyle={{ color: 'oklch(0.65 0 0)' }}
              cursor={false}
            />
            <Bar dataKey="value" shape={renderBar}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === maxIndex ? 'rgba(127,119,221,0.75)' : 'rgba(255,255,255,0.04)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
