'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatInterface from '../../components/chat/ChatInterface'

function ChatInner() {
  const params = useSearchParams()
  const initial = params.get('q') ?? undefined
  return <ChatInterface initialQuery={initial} />
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-tertiary)', fontSize: 13 }}>Loading…</div>}>
      <ChatInner />
    </Suspense>
  )
}
