'use client'

import { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import ChatMessage from './ChatMessage'
import { useChat } from '../../hooks/useChat'

const STARTERS = [
  'What was total fuel spend last month?',
  'Show me all transactions over $1,000',
  'Which card has the most violations?',
  'What did we spend on permits in October?',
  'Are there any suspicious charge patterns?',
  'Compare fuel costs month over month',
]

interface Props {
  initialQuery?: string
}

export default function ChatInterface({ initialQuery }: Props) {
  const { messages, isLoading, input, setInput, sendMessage } = useChat(initialQuery)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) sendMessage(input)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) sendMessage(input)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 12px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
              Ask anything
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 32 }}>
              6 months of fleet transactions, ready to answer
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560 }}>
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    fontSize: 12,
                    padding: '7px 14px',
                    borderRadius: 20,
                    background: 'var(--surface-2)',
                    border: '0.5px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 24px 16px',
        borderTop: '0.5px solid var(--border-subtle)',
        background: 'var(--surface-1)',
        flexShrink: 0,
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your fleet expenses…"
              rows={1}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '0.5px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--text-primary)',
                resize: 'none',
                lineHeight: 1.5,
                maxHeight: 120,
                overflow: 'auto',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: !input.trim() || isLoading ? 'var(--surface-3)' : 'var(--sev-approval-bg)',
              color: !input.trim() || isLoading ? 'var(--text-tertiary)' : '#AFA9EC',
              border: '0.5px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 150ms ease',
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}
