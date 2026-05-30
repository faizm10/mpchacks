'use client';

import { useState, useCallback } from 'react';
import ApprovalFeed from '@/components/approvals/ApprovalFeed';
import ApprovalDetail from '@/components/approvals/ApprovalDetail';
import { Sparkles, Inbox } from 'lucide-react';

export default function ApprovalsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState(0);

  const handleDecision = useCallback(() => {
    setFeedKey(k => k + 1);
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-0)',
      overflow: 'hidden',
    }}>
      {/* Top nav bar */}
      <header style={{
        height: 52,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        background: 'var(--bg-1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--violet)" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
            Trail<span style={{ color: 'var(--violet)' }}>Blazer</span>
          </span>
        </div>
        <span style={{
          fontSize: 11,
          color: 'var(--text-3)',
          background: 'var(--bg-3)',
          padding: '2px 10px',
          borderRadius: 99,
          border: '1px solid var(--border)',
        }}>
          AI Pre-Approval Workflow
        </span>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
          Finance Manager View
        </div>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Approval feed */}
        <ApprovalFeed
          key={feedKey}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Detail panel */}
        <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-1)' }}>
          {selectedId ? (
            <ApprovalDetail
              key={selectedId}
              approvalId={selectedId}
              onDecision={handleDecision}
            />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyDetail() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-3)',
      gap: 14,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'rgba(127,119,221,0.08)',
        border: '1px solid rgba(127,119,221,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Inbox size={26} color="var(--violet)" style={{ opacity: 0.6 }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>
          Select an approval request
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 280, lineHeight: 1.6 }}>
          Pick a request from the list. The AI will prepare a full context brief so you can make a confident decision in seconds.
        </p>
      </div>
    </div>
  );
}
