'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MOCK_INBOX_ITEMS } from '../../lib/mock-data'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/chat', label: 'Chat' },
  { href: '/reports', label: 'Reports' },
  { href: '/spend', label: 'Spend' },
  { href: '/policy', label: 'Policy' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const unread = MOCK_INBOX_ITEMS.filter(i => !i.isRead && !i.isResolved).length
  const pendingReports = MOCK_INBOX_ITEMS.filter(i => i.type === 'approval' && !i.isResolved).length

  return (
    <div style={{
      width: 220,
      height: '100vh',
      background: 'var(--sidebar)',
      borderRight: '0.5px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 14px',
        borderBottom: '0.5px solid var(--sidebar-border)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          TrailBlazer
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          Expense Intelligence
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {NAV.map(item => {
          const isActive = pathname === item.href
          const badge = item.href === '/inbox' ? unread : item.href === '/reports' ? pendingReports : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#AFA9EC' : 'var(--text-secondary)',
                background: isActive ? 'var(--sev-approval-bg)' : 'transparent',
                borderLeft: isActive ? '2px solid #7F77DD' : '2px solid transparent',
                transition: 'all 150ms ease',
              }}
            >
              <span>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 500,
                  background: item.href === '/inbox' ? '#D85A30' : '#BA7517',
                  color: 'white',
                  borderRadius: 20,
                  padding: '1px 7px',
                  minWidth: 18,
                  textAlign: 'center',
                  lineHeight: '16px',
                }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* AI Status */}
      <div style={{
        margin: '0 8px 12px',
        padding: '10px 12px',
        background: 'var(--surface-2)',
        borderRadius: 8,
        border: '0.5px solid var(--border-subtle)',
      }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          marginBottom: 8,
        }}>
          AI Status
        </div>
        {[{ name: 'Claude' }, { name: 'Gemini' }].map(ai => (
          <div key={ai.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#5DCAA5',
              flexShrink: 0,
              boxShadow: '0 0 6px #5DCAA580',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ai.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
