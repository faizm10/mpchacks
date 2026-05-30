import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrailBlazer — AI Pre-Approval Workflow',
  description: 'AI-powered expense approval assistant for finance managers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ height: '100%', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
