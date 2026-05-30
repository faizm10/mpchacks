import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Severity, PolicyStatus, ViolationType } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString + 'T00:00:00'))
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sMonth = s.toLocaleString('en-CA', { month: 'short' })
  const eMonth = e.toLocaleString('en-CA', { month: 'short' })
  const sDay = s.getDate()
  const eDay = e.getDate()
  const year = e.getFullYear()
  if (sMonth === eMonth && s.getFullYear() === e.getFullYear()) {
    return `${sMonth} ${sDay} – ${eDay}, ${year}`
  }
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function getSeverityStyles(severity: Severity): {
  bg: string
  text: string
  border: string
  leftBorder: string
} {
  switch (severity) {
    case 'high':
      return { bg: 'oklch(0.11 0.04 27)', text: '#F0997B', border: 'oklch(1 0 0 / 8%)', leftBorder: '#D85A30' }
    case 'medium':
      return { bg: 'oklch(0.11 0.04 65)', text: '#EF9F27', border: 'oklch(1 0 0 / 8%)', leftBorder: '#BA7517' }
    case 'low':
      return { bg: 'oklch(0.10 0.04 220)', text: '#85B7EB', border: 'oklch(1 0 0 / 8%)', leftBorder: '#378ADD' }
  }
}

export function getViolationTypeLabel(type: ViolationType): string {
  const labels: Record<ViolationType, string> = {
    split_charge: 'Split charge',
    personal_expense: 'Personal expense',
    unauthorized_category: 'Unauthorized category',
    over_limit: 'Over limit',
    alcohol: 'Alcohol',
    missing_receipt: 'Missing receipt',
    duplicate_charge: 'Duplicate charge',
  }
  return labels[type]
}

export function getPolicyStatusStyles(status: PolicyStatus): {
  bg: string
  text: string
  border: string
  label: string
} {
  switch (status) {
    case 'compliant':
      return { bg: 'oklch(0.10 0.04 165)', text: '#5DCAA5', border: 'oklch(1 0 0 / 8%)', label: 'Compliant' }
    case 'violations':
      return { bg: 'oklch(0.11 0.04 27)', text: '#F0997B', border: 'oklch(1 0 0 / 8%)', label: 'Violations found' }
    case 'pending_review':
      return { bg: 'oklch(0.11 0.04 65)', text: '#EF9F27', border: 'oklch(1 0 0 / 8%)', label: 'Pending review' }
  }
}
