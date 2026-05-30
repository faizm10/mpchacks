'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const PAGE_TITLES: Record<string, string> = {
  '/inbox': 'Inbox',
  '/chat': 'Ask AI',
  '/reports': 'Trip Reports',
  '/spend': 'Spend Analytics',
  '/policy': 'Expense Policy',
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'TrailBlazer'

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--surface-0)',
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar title={title} />
        <main style={{ flex: 1, overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
