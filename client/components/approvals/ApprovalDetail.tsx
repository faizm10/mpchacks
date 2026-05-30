'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sparkles, CheckCircle2, XCircle, RotateCcw, AlertTriangle,
  TrendingUp, Shield, DollarSign, Clock, User, FileText,
  Receipt, Calendar, ChevronRight, Loader2, CheckCheck,
} from 'lucide-react';
import type { ApprovalDetail as ApprovalDetailType, AIAnalysis } from '@/lib/types';
import { fetchApprovalDetail, analyzeApproval, submitDecision, fmtCurrency, fmtDate, timeAgo } from '@/lib/api';

interface Props {
  approvalId: string;
  onDecision: () => void;
}

const DEPT_COLORS: Record<string, string> = {
  Marketing: '#7f77dd', Engineering: '#1d9e75', Finance: '#d4900a',
  Sales: '#e05a6a', Operations: '#38bdf8', Fleet: '#fb923c',
};

export default function ApprovalDetail({ approvalId, onDecision }: Props) {
  const [detail, setDetail] = useState<ApprovalDetailType | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [decided, setDecided] = useState(false);

  const load = useCallback(async () => {
    setLoadingDetail(true);
    setAnalysis(null);
    setDecided(false);
    try {
      const d = await fetchApprovalDetail(approvalId);
      setDetail(d);
      if (d.decision) setDecided(true);
    } finally {
      setLoadingDetail(false);
    }
  }, [approvalId]);

  useEffect(() => { load(); }, [load]);

  async function runAnalysis() {
    setLoadingAnalysis(true);
    try {
      const a = await analyzeApproval(approvalId);
      setAnalysis(a);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function decide(action: 'approve' | 'deny' | 'review') {
    setDeciding(action);
    try {
      await submitDecision(approvalId, action);
      setDecided(true);
      onDecision();
    } finally {
      setDeciding(null);
    }
  }

  if (loadingDetail) {
    return (
      <EmptyState>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
        <p style={{ marginTop: 12, color: 'var(--text-3)', fontSize: 13 }}>Loading request…</p>
      </EmptyState>
    );
  }

  if (!detail) {
    return (
      <EmptyState>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Request not found</p>
      </EmptyState>
    );
  }

  const { employee, expense, budget, history, policies } = detail;
  const deptColor = DEPT_COLORS[employee.department] ?? 'var(--violet)';
  const budgetAfterPct = Math.min(Math.round(((budget.used + expense.amount) / budget.total) * 100), 100);
  const isPending = detail.status === 'pending' && !decided;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        padding: '18px 24px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexShrink: 0,
        background: 'var(--bg-1)',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `${deptColor}20`,
          border: `2px solid ${deptColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: deptColor,
          flexShrink: 0,
        }}>
          {employee.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{employee.name}</h2>
            <span style={{ fontSize: 11, color: deptColor, background: `${deptColor}15`, padding: '1px 7px', borderRadius: 99, border: `1px solid ${deptColor}30` }}>
              {employee.department}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {employee.role} · {employee.yearsAtCompany}y at company · Submitted {timeAgo(detail.requestedAt)}
          </p>
        </div>
        <div className="num" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>
            {fmtCurrency(expense.amount, expense.currency)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{expense.currency}</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Expense info card */}
        <Section title="Expense Details" icon={<FileText size={14} />}>
          <InfoRow label="Merchant"  value={expense.merchant} />
          <InfoRow label="Category"  value={expense.category} />
          <InfoRow label="Date"      value={fmtDate(expense.date)} />
          <InfoRow label="Receipt"   value={expense.hasReceipt ? '✓ Attached' : '✗ Missing'} valueColor={expense.hasReceipt ? 'var(--green)' : 'var(--deny)'} />
          {expense.description && (
            <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              "{expense.description}"
            </div>
          )}
        </Section>

        {/* Budget gauge */}
        <Section title={`${employee.department} Budget — ${budget.period}`} icon={<DollarSign size={14} />}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <Stat label="Total"     value={fmtCurrency(budget.total)}    />
            <Stat label="Used"      value={fmtCurrency(budget.used)}     accent="var(--review)" />
            <Stat label="Remaining" value={fmtCurrency(budget.remaining)} accent={budget.remaining < expense.amount ? 'var(--deny)' : 'var(--green)'} />
          </div>
          <BudgetBar current={budget.percentUsed} after={budgetAfterPct} amount={expense.amount} remaining={budget.remaining} />
        </Section>

        {/* Spending history */}
        <Section title="Employee Spending History" icon={<TrendingUp size={14} />}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <MiniStat label="Spent (90d)"  value={fmtCurrency(history.totalSpent90d)} />
            <MiniStat label="Avg/month"    value={fmtCurrency(history.avgMonthlySpend)} />
            <MiniStat label="Requests (12m)" value={String(history.approvalsRequested12m)} />
            <MiniStat label="Denied (12m)" value={String(history.approvalsDenied12m)} accent={history.approvalsDenied12m > 1 ? 'var(--review)' : undefined} />
            <MiniStat label="Flagged"      value={String(history.flaggedTransactions)} accent={history.flaggedTransactions > 0 ? 'var(--deny)' : undefined} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Common categories: {history.commonCategories.join(' · ')}</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Recent approvals</p>
          {history.recentApprovals.map((ra, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              background: 'var(--bg-3)',
              borderRadius: 7,
              marginBottom: 5,
              fontSize: 12,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: ra.decision === 'approved' ? 'var(--approve)' : 'var(--deny)',
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ra.description}
              </span>
              <span className="num" style={{ color: 'var(--text-2)', flexShrink: 0 }}>{fmtCurrency(ra.amount)}</span>
              <span style={{ fontSize: 10, color: ra.decision === 'approved' ? 'var(--approve)' : 'var(--deny)', flexShrink: 0 }}>
                {ra.decision}
              </span>
            </div>
          ))}
        </Section>

        {/* Policy check */}
        <Section title="Policy Rules" icon={<Shield size={14} />}>
          {policies.map(p => (
            <div key={p.id} style={{
              display: 'flex',
              gap: 10,
              padding: '9px 12px',
              background: 'var(--bg-3)',
              borderRadius: 8,
              marginBottom: 6,
              border: `1px solid ${p.severity === 'high' ? 'rgba(224,90,106,0.2)' : p.severity === 'medium' ? 'rgba(212,144,10,0.15)' : 'var(--border)'}`,
            }}>
              <span className={`badge badge-${p.severity}`} style={{ flexShrink: 0, height: 'fit-content', marginTop: 1, fontSize: 9 }}>
                {p.severity}
              </span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2 }}>{p.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{p.description}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* AI Analysis */}
        <Section title="AI Analysis" icon={<Sparkles size={14} color="var(--violet)" />} accent>
          {!analysis && !loadingAnalysis && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
                Get a full AI-powered recommendation in seconds.
              </p>
              <button
                onClick={runAnalysis}
                style={{
                  background: 'linear-gradient(135deg, #7f77dd, #5b54c4)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 22px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <Sparkles size={14} />
                Analyse with AI
              </button>
            </div>
          )}

          {loadingAnalysis && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
                Analysing employee history, budget, and policy…
              </p>
            </div>
          )}

          {analysis && <AIAnalysisPanel analysis={analysis} />}
        </Section>
      </div>

      {/* Decision bar */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-1)',
        flexShrink: 0,
      }}>
        {decided ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            color: 'var(--green)',
            fontSize: 13,
            fontWeight: 500,
          }}>
            <CheckCheck size={16} />
            Decision recorded — {detail.decision?.status ?? 'decided'}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <DecisionButton
              label="Approve"
              icon={<CheckCircle2 size={15} />}
              color="var(--approve)"
              bg="rgba(34,200,122,0.12)"
              border="rgba(34,200,122,0.3)"
              loading={deciding === 'approve'}
              disabled={!isPending || deciding !== null}
              onClick={() => decide('approve')}
            />
            <DecisionButton
              label="Needs Review"
              icon={<RotateCcw size={15} />}
              color="var(--review)"
              bg="rgba(212,144,10,0.12)"
              border="rgba(212,144,10,0.3)"
              loading={deciding === 'review'}
              disabled={!isPending || deciding !== null}
              onClick={() => decide('review')}
            />
            <DecisionButton
              label="Deny"
              icon={<XCircle size={15} />}
              color="var(--deny)"
              bg="rgba(224,90,106,0.12)"
              border="rgba(224,90,106,0.3)"
              loading={deciding === 'deny'}
              disabled={!isPending || deciding !== null}
              onClick={() => decide('deny')}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────

function AIAnalysisPanel({ analysis }: { analysis: AIAnalysis }) {
  const recColor = analysis.recommendation === 'approve' ? 'var(--approve)'
    : analysis.recommendation === 'deny' ? 'var(--deny)'
    : 'var(--review)';
  const recBg = analysis.recommendation === 'approve' ? 'rgba(34,200,122,0.08)'
    : analysis.recommendation === 'deny' ? 'rgba(224,90,106,0.08)'
    : 'rgba(212,144,10,0.08)';
  const recBorder = analysis.recommendation === 'approve' ? 'rgba(34,200,122,0.25)'
    : analysis.recommendation === 'deny' ? 'rgba(224,90,106,0.25)'
    : 'rgba(212,144,10,0.25)';
  const RecIcon = analysis.recommendation === 'approve' ? CheckCircle2
    : analysis.recommendation === 'deny' ? XCircle
    : RotateCcw;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {analysis._fallback && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, padding: '6px 10px', background: 'var(--bg-4)', borderRadius: 6 }}>
          ⚠ AI unavailable — showing rule-based fallback. Set ANTHROPIC_API_KEY for full analysis.
        </div>
      )}

      {/* Recommendation card */}
      <div style={{
        background: recBg,
        border: `1px solid ${recBorder}`,
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <RecIcon size={20} color={recColor} />
          <span style={{ fontSize: 15, fontWeight: 700, color: recColor, textTransform: 'capitalize' }}>
            {analysis.recommendation === 'review' ? 'Needs Review' : analysis.recommendation}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <RiskGauge score={analysis.riskScore} level={analysis.riskLevel} />
          </div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
          {analysis.headline}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>
          {analysis.reasoning}
        </p>
      </div>

      {/* Flags */}
      {analysis.flags.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7 }}>
            Concerns
          </p>
          {analysis.flags.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5, fontSize: 12, color: 'var(--text-2)' }}>
              <AlertTriangle size={13} color="var(--review)" style={{ flexShrink: 0, marginTop: 1 }} />
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Positives */}
      {analysis.positives.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7 }}>
            Supporting Factors
          </p>
          {analysis.positives.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5, fontSize: 12, color: 'var(--text-2)' }}>
              <CheckCircle2 size={13} color="var(--approve)" style={{ flexShrink: 0, marginTop: 1 }} />
              {p}
            </div>
          ))}
        </div>
      )}

      {/* Policy violations */}
      {analysis.policyViolations.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--deny)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 7 }}>
            Policy Violations
          </p>
          {analysis.policyViolations.map((v, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              background: 'rgba(224,90,106,0.07)',
              border: '1px solid rgba(224,90,106,0.2)',
              borderRadius: 7,
              fontSize: 12,
              color: 'var(--deny)',
              marginBottom: 5,
            }}>
              {v}
            </div>
          ))}
        </div>
      )}

      {/* Budget + pattern */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <InsightCard icon={<DollarSign size={13} color="var(--violet)" />} label="Budget Impact" text={analysis.budgetImpact} />
        <InsightCard icon={<TrendingUp size={13} color="var(--violet)" />} label="Spending Pattern" text={analysis.patternInsights} />
      </div>

      {/* Approver action */}
      <div style={{
        padding: '11px 14px',
        background: 'rgba(127,119,221,0.07)',
        border: '1px solid rgba(127,119,221,0.18)',
        borderRadius: 9,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
      }}>
        <ChevronRight size={14} color="var(--violet)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--violet)', marginBottom: 3 }}>Action for Approver</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{analysis.approverAction}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskGauge({ score, level }: { score: number; level: string }) {
  const color = level === 'low' ? 'var(--green)' : level === 'medium' ? 'var(--review)' : 'var(--deny)';
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (1 - score / 100);

  return (
    <div style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
      <svg width="58" height="58" viewBox="0 0 58 58" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="29" cy="29" r={radius} fill="none" stroke="var(--bg-4)" strokeWidth="4" />
        <circle cx="29" cy="29" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="num" style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>risk</span>
      </div>
    </div>
  );
}

function BudgetBar({ current, after, amount, remaining }: { current: number; after: number; amount: number; remaining: number }) {
  const overBudget = amount > remaining;
  return (
    <div>
      <div style={{ height: 10, background: 'var(--bg-4)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${current}%`,
          background: current > 90 ? 'var(--deny)' : current > 75 ? 'var(--review)' : 'var(--violet)',
          borderRadius: 5,
        }} />
        <div style={{
          position: 'absolute', left: `${current}%`, top: 0, bottom: 0,
          width: `${after - current}%`,
          background: overBudget ? 'rgba(224,90,106,0.5)' : 'rgba(34,200,122,0.4)',
          borderRadius: '0 5px 5px 0',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 6px)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{current}% currently used</span>
        <span style={{ fontSize: 10, color: overBudget ? 'var(--deny)' : 'var(--text-3)' }}>
          {overBudget ? '⚠ Would exceed budget' : `${after}% after approval`}
        </span>
      </div>
    </div>
  );
}

function Section({ title, icon, children, accent }: { title: string; icon: React.ReactNode; children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      marginBottom: 20,
      padding: 16,
      background: accent ? 'rgba(127,119,221,0.04)' : 'var(--bg-2)',
      border: `1px solid ${accent ? 'rgba(127,119,221,0.15)' : 'var(--border)'}`,
      borderRadius: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <span style={{ color: accent ? 'var(--violet)' : 'var(--text-3)' }}>{icon}</span>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: accent ? 'var(--violet)' : 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 12, color: valueColor ?? 'var(--text-1)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 16, fontWeight: 700, color: accent ?? 'var(--text-1)', marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '7px 11px', minWidth: 70 }}>
      <div className="num" style={{ fontSize: 14, fontWeight: 700, color: accent ?? 'var(--text-1)', marginBottom: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</div>
    </div>
  );
}

function InsightCard({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div style={{ background: 'var(--bg-3)', borderRadius: 9, padding: '10px 12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}

function DecisionButton({
  label, icon, color, bg, border, loading, disabled, onClick,
}: {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
  loading: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '10px 0',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 9,
        color,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'opacity 0.15s',
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      {children}
    </div>
  );
}
