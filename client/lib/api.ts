import type { InboxItem, Violation, ApprovalRequest, Trip, SpendSummary, PolicyRule, ChatMessage, Transaction } from './types'
import { API_BASE } from './constants'
import {
  MOCK_INBOX_ITEMS,
  MOCK_VIOLATIONS,
  MOCK_APPROVALS,
  MOCK_TRIPS,
  MOCK_SPEND_SUMMARY,
  MOCK_POLICY_RULES,
} from './mock-data'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timeout)
  }
}

export async function getInboxItems(): Promise<InboxItem[]> {
  try { return await apiFetch<InboxItem[]>('/inbox') } catch { return MOCK_INBOX_ITEMS }
}

export async function resolveInboxItem(id: string, action: string): Promise<void> {
  try { await apiFetch<void>(`/inbox/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action }) }) } catch { /* mock */ }
}

export async function getViolations(): Promise<Violation[]> {
  try { return await apiFetch<Violation[]>('/violations') } catch { return MOCK_VIOLATIONS }
}

export async function getApprovals(): Promise<ApprovalRequest[]> {
  try { return await apiFetch<ApprovalRequest[]>('/approvals') } catch { return MOCK_APPROVALS }
}

export async function approveRequest(id: string): Promise<void> {
  try { await apiFetch<void>(`/approvals/${id}/approve`, { method: 'POST' }) } catch { /* mock */ }
}

export async function denyRequest(id: string): Promise<void> {
  try { await apiFetch<void>(`/approvals/${id}/deny`, { method: 'POST' }) } catch { /* mock */ }
}

export async function getTrips(): Promise<Trip[]> {
  try { return await apiFetch<Trip[]>('/trips') } catch { return MOCK_TRIPS }
}

export async function getSpendSummary(): Promise<SpendSummary> {
  try { return await apiFetch<SpendSummary>('/spend/summary') } catch { return MOCK_SPEND_SUMMARY }
}

export async function getPolicyRules(): Promise<PolicyRule[]> {
  try { return await apiFetch<PolicyRule[]>('/policy/rules') } catch { return MOCK_POLICY_RULES }
}

export async function togglePolicyRule(id: string, isActive: boolean): Promise<void> {
  try { await apiFetch<void>(`/policy/rules/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive }) }) } catch { /* mock */ }
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<{ content: string; transactions?: Transaction[]; chartData?: ChatMessage['chartData'] }> {
  try {
    return await apiFetch<{ content: string; transactions?: Transaction[]; chartData?: ChatMessage['chartData'] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    })
  } catch {
    return getMockChatResponse(message)
  }
}

export async function runComplianceScan(): Promise<Violation[]> {
  try { return await apiFetch<Violation[]>('/violations/scan', { method: 'POST' }) } catch { return MOCK_VIOLATIONS }
}

function getMockChatResponse(message: string): { content: string; transactions?: Transaction[]; chartData?: ChatMessage['chartData'] } {
  const lower = message.toLowerCase()

  if (lower.includes('fuel')) {
    return {
      content: 'Total fuel spend over the 6-month period is **$674,495.27** across approximately 1,800 transactions. Flying J and Love\'s locations account for the largest share. Average fuel transaction is $374.',
      chartData: {
        type: 'bar', title: 'Monthly Fuel Spend',
        data: [
          { label: 'Sep 25', value: 112000, color: '#378ADD' },
          { label: 'Oct 25', value: 134000, color: '#378ADD' },
          { label: 'Nov 25', value: 98000, color: '#378ADD' },
          { label: 'Dec 25', value: 142000, color: '#378ADD' },
          { label: 'Jan 26', value: 108000, color: '#378ADD' },
          { label: 'Feb 26', value: 80495, color: '#378ADD' },
        ],
      },
    }
  }

  if (lower.includes('violation') || lower.includes('suspicious')) {
    return {
      content: 'I found **6 active violations** on Card 3001:\n\n• 2 split charge patterns (WSDOT $6,234 and Kwik Trip $2,054)\n• 3 personal expenses (shoe store, food delivery, florist)\n• 1 unauthorized category (gift card)\n\nThe split charge patterns are the most concerning — both show multiple same-day charges at identical merchants well below the $50 pre-auth threshold.',
    }
  }

  if (lower.includes('permit') || lower.includes('october') || lower.includes('spend')) {
    return {
      content: 'Permit spend totalled **$356,661.00** over the 6-month period. Top permit vendors by volume: DTOPS (167 transactions), AB Transport (158), NDHP-E (134), SD Dept of Trans (131), and TXDMV (102).',
      chartData: {
        type: 'bar', title: 'Top Permit Vendors',
        data: [
          { label: 'DTOPS', value: 4648, color: '#BA7517' },
          { label: 'AB TRANSP', value: 18420, color: '#BA7517' },
          { label: 'NDHP-E', value: 5314, color: '#BA7517' },
          { label: 'SD TRANS', value: 7842, color: '#BA7517' },
          { label: 'TXDMV', value: 32841, color: '#BA7517' },
        ],
      },
    }
  }

  if (lower.includes('1,000') || lower.includes('1000') || lower.includes('over')) {
    return {
      content: 'Here are transactions over $1,000 from the dataset:',
      transactions: [
        MOCK_APPROVALS[0].transaction,
        ...MOCK_VIOLATIONS[0].relatedTransactions || [],
        MOCK_VIOLATIONS[0].transaction,
      ],
    }
  }

  if (lower.includes('month') || lower.includes('trend')) {
    return {
      content: 'Monthly spend trend over 6 months shows a peak in December 2025 ($521K) and lowest in November 2025 ($398K). Total for the period: **$2,717,509.64**.',
      chartData: {
        type: 'line', title: 'Monthly Spend Trend',
        data: [
          { label: 'Sep 25', value: 412840 },
          { label: 'Oct 25', value: 489320 },
          { label: 'Nov 25', value: 398150 },
          { label: 'Dec 25', value: 521480 },
          { label: 'Jan 26', value: 443920 },
          { label: 'Feb 26', value: 451800 },
        ],
      },
    }
  }

  return {
    content: `I've analyzed your fleet expense data for the 6-month period. The dataset contains **4,235 transactions** totalling **$2,717,509.64** across fuel, permits, tires, repairs, tolls, and other categories.\n\nCard 3001 has **6 active violations** and **2 pending approvals** that need your attention. Try asking about specific categories, date ranges, or suspicious patterns.`,
  }
}
