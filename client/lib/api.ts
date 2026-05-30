import type { ApprovalSummary, ApprovalDetail, AIAnalysis } from './types';

const BASE = '/api';

export async function fetchApprovals(): Promise<ApprovalSummary[]> {
  const res = await fetch(`${BASE}/approvals`);
  if (!res.ok) throw new Error('Failed to fetch approvals');
  return res.json();
}

export async function fetchApprovalDetail(id: string): Promise<ApprovalDetail> {
  const res = await fetch(`${BASE}/approvals/${id}`);
  if (!res.ok) throw new Error('Failed to fetch approval');
  return res.json();
}

export async function analyzeApproval(id: string): Promise<AIAnalysis> {
  const res = await fetch(`${BASE}/approvals/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to analyze approval');
  return res.json();
}

export async function submitDecision(id: string, action: 'approve' | 'deny' | 'review', note?: string) {
  const res = await fetch(`${BASE}/approvals/${id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) throw new Error('Failed to submit decision');
  return res.json();
}

export function fmtCurrency(amount: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
