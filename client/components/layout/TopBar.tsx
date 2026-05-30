'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { MOCK_INBOX_ITEMS } from '../../lib/mock-data'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const unread = MOCK_INBOX_ITEMS.filter(i => !i.isRead && !i.isResolved).length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/chat?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      borderBottom: '0.5px solid var(--border-subtle)',
      background: 'var(--surface-1)',
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', minWidth: 100 }}>
        {title}
      </div>

      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 440 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask anything about your expenses..."
          style={{
            width: '100%',
            height: 30,
            background: 'var(--surface-2)',
            border: '0.5px solid var(--border-subtle)',
            borderRadius: 20,
            padding: '0 14px',
            fontSize: 12,
            color: 'var(--text-primary)',
          }}
        />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => router.push('/inbox')}>
          <Bell size={15} color="var(--text-secondary)" />
          {unread > 0 && (
            <span style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 14,
              height: 14,
              background: '#D85A30',
              borderRadius: '50%',
              fontSize: 9,
              fontWeight: 500,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {unread}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Finance Manager</span>
      </div>
    </div>
  )
}
