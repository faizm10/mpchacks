'use client';

import { Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, Receipt } from 'lucide-react';
import type { ApprovalSummary } from '@/lib/types';
import { fmtCurrency, timeAgo } from '@/lib/api';

interface Props {
  approval: ApprovalSummary;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'var(--violet)',  icon: Clock        },
  approved: { label: 'Approved', color: 'var(--approve)', icon: CheckCircle  },
  denied:   { label: 'Denied',   color: 'var(--deny)',    icon: XCircle      },
  review:   { label: 'Review',   color: 'var(--review)',  icon: RotateCcw    },
} as const;

const DEPT_COLORS: Record<string, string> = {
  Marketing:   '#7f77dd',
  Engineering: '#1d9e75',
  Finance:     '#d4900a',
  Sales:       '#e05a6a',
  Operations:  '#38bdf8',
  Fleet:       '#fb923c',
};

export default function ApprovalCard({ approval, isSelected, onClick }: Props) {
  const { employee, expense, budget, status, requestedAt } = approval;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const deptColor = DEPT_COLORS[employee.department] ?? 'var(--violet)';
  const isHighRisk = approval.approvalsDenied12m > 1 || approval.flaggedTransactions > 0;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: isSelected ? 'var(--bg-3)' : 'var(--bg-2)',
        border: `1px solid ${isSelected ? 'var(--border-hi)' : 'var(--border)'}`,
        borderLeft: isSelected ? `3px solid var(--violet)` : '3px solid transparent',
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        marginBottom: 8,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: `${deptColor}22`,
          border: `1.5px solid ${deptColor}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: deptColor,
          flexShrink: 0,
        }}>
          {employee.initials}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
              {employee.name}
            </span>
            {isHighRisk && (
              <AlertTriangle size={12} color="var(--review)" style={{ flexShrink: 0 }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {employee.role} · {employee.department}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="num" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
            {fmtCurrency(expense.amount, expense.currency)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {expense.currency}
          </div>
        </div>
      </div>

      {/* Merchant */}
      <div style={{
        fontSize: 12,
        color: 'var(--text-2)',
        marginBottom: 10,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {expense.merchant}
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Status badge */}
        <span className={`badge badge-${status}`} style={{ fontSize: 10 }}>
          <StatusIcon size={10} />
          {cfg.label}
        </span>

        {/* Category */}
        <span style={{
          fontSize: 10,
          color: 'var(--text-3)',
          background: 'var(--bg-4)',
          padding: '2px 7px',
          borderRadius: 99,
        }}>
          {expense.category}
        </span>

        {/* No receipt warning */}
        {!expense.hasReceipt && (
          <span style={{ fontSize: 10, color: 'var(--review)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Receipt size={10} /> No receipt
          </span>
        )}

        {/* Time */}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>
          {timeAgo(requestedAt)}
        </span>
      </div>

      {/* Budget bar */}
      {status === 'pending' && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {employee.department} budget
            </span>
            <span className="num" style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {budget.percentUsed}% used
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--bg-4)', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: `${Math.min(budget.percentUsed, 100)}%`,
              background: budget.percentUsed > 90 ? 'var(--deny)'
                : budget.percentUsed > 75 ? 'var(--review)'
                : 'var(--violet)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}
    </button>
  );
}
