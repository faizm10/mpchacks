'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Inbox } from 'lucide-react';
import ApprovalCard from './ApprovalCard';
import type { ApprovalSummary } from '@/lib/types';
import { fetchApprovals } from '@/lib/api';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ApprovalFeed({ selectedId, onSelect }: Props) {
  const [approvals, setApprovals] = useState<ApprovalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApprovals();
      setApprovals(data);
    } catch {
      setError('Could not reach the server. Is it running on port 8000?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pending  = approvals.filter(a => a.status === 'pending');
  const decided  = approvals.filter(a => a.status !== 'pending');

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-1)',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
            Approvals
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {loading ? '—' : `${pending.length} pending · ${decided.length} decided`}
          </p>
        </div>
        <button
          onClick={load}
          title="Refresh"
          style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '6px 8px',
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--text-3)', fontSize: 13 }}>
            Loading approvals…
          </div>
        )}

        {error && (
          <div style={{
            margin: 12,
            padding: 14,
            background: 'rgba(224,90,106,0.08)',
            border: '1px solid rgba(224,90,106,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--deny)',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && pending.length === 0 && decided.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-3)' }}>
            <Inbox size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ fontSize: 13 }}>No approval requests</p>
          </div>
        )}

        {!loading && pending.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              Pending ({pending.length})
            </p>
            {pending.map(a => (
              <ApprovalCard
                key={a.id}
                approval={a}
                isSelected={a.id === selectedId}
                onClick={() => onSelect(a.id)}
              />
            ))}
          </>
        )}

        {!loading && decided.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '16px 0 8px' }}>
              Decided ({decided.length})
            </p>
            {decided.map(a => (
              <ApprovalCard
                key={a.id}
                approval={a}
                isSelected={a.id === selectedId}
                onClick={() => onSelect(a.id)}
              />
            ))}
          </>
        )}

        <div style={{ height: 20 }} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
