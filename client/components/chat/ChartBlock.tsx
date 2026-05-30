'use client'

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '../../lib/utils'

interface ChartData {
  type: 'bar' | 'line' | 'pie'
  title: string
  data: { label: string; value: number; color?: string }[]
}

interface Props {
  chartData: ChartData
}

const DEFAULT_COLOR = '#7F77DD'

export default function ChartBlock({ chartData }: Props) {
  const { type, title, data } = chartData
  const rechartData = data.map(d => ({ name: d.label, value: d.value, color: d.color }))

  return (
    <div style={{
      marginTop: 10,
      background: 'var(--surface-2)',
      border: '0.5px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '12px 12px 8px',
    }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: 8, letterSpacing: '0.04em' }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={180}>
        {type === 'line' ? (
          <LineChart data={rechartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'oklch(0.40 0 0)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'oklch(0.40 0 0)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-1)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
              formatter={(v: unknown) => formatCurrency(Number(v))}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={DEFAULT_COLOR}
              strokeWidth={2}
              dot={{ fill: DEFAULT_COLOR, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        ) : (
          <BarChart data={rechartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'oklch(0.40 0 0)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'oklch(0.40 0 0)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-1)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
              formatter={(v: unknown) => formatCurrency(Number(v))}
              labelStyle={{ color: 'var(--text-secondary)' }}
              cursor={{ fill: 'oklch(1 0 0 / 4%)' }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {rechartData.map((entry, i) => (
                <Cell key={i} fill={entry.color ?? DEFAULT_COLOR} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
