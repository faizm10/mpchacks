'use client'

import type { ChatMessage as ChatMessageType } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/utils'
import ChartBlock from './ChartBlock'

interface Props {
  message: ChatMessageType
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{
          maxWidth: '72%',
          background: 'var(--sev-approval-bg)',
          color: '#AFA9EC',
          borderRadius: '12px 12px 2px 12px',
          padding: '9px 14px',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          {message.content}
        </div>
      </div>
    )
  }

  if (message.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
        <div style={{
          background: 'var(--surface-2)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '12px 12px 12px 2px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 3,
                background: '#7F77DD',
                borderRadius: 2,
                animation: `waveform 1.1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: 'var(--surface-2)',
          border: '0.5px solid var(--border-subtle)',
          borderRadius: '12px 12px 12px 2px',
          padding: '10px 14px',
          fontSize: 13,
          lineHeight: 1.65,
          color: 'var(--text-primary)',
        }}>
          <MarkdownContent content={message.content} />
        </div>

        {message.chartData && (
          <ChartBlock chartData={message.chartData} />
        )}

        {message.transactions && message.transactions.length > 0 && (
          <div style={{
            marginTop: 8,
            background: 'var(--surface-2)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
                  {['Date', 'Merchant', 'Amount', 'Location'].map(h => (
                    <th key={h} style={{
                      padding: '7px 10px',
                      fontSize: 10, fontWeight: 500,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                      textAlign: 'left',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.transactions.slice(0, 5).map((tx, i) => (
                  <tr key={tx.id} style={{
                    borderBottom: i < Math.min(message.transactions!.length, 5) - 1 ? '0.5px solid var(--border-subtle)' : 'none',
                    background: i % 2 === 1 ? 'var(--surface-3)' : 'transparent',
                  }}>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)' }}>
                      {tx.merchantName}
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono), monospace', color: 'var(--text-primary)' }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {[tx.city, tx.state].filter(Boolean).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {message.transactions.length > 5 && (
              <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--sev-approval-text)', cursor: 'pointer' }}>
                View all {message.transactions.length} transactions →
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, paddingLeft: 2 }}>
          {message.timestamp.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
