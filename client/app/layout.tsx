import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import RootShell from '../components/layout/RootShell'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TrailBlazer — Fleet Expense Intelligence',
  description: 'AI-powered expense compliance and approval platform for fleet operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`} style={{ height: '100%' }}>
      <body style={{ height: '100%', overflow: 'hidden' }}>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  )
}
