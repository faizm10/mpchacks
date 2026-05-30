export type Severity = 'high' | 'medium' | 'low'
export type ViolationType =
  | 'split_charge'
  | 'personal_expense'
  | 'unauthorized_category'
  | 'over_limit'
  | 'alcohol'
  | 'missing_receipt'
  | 'duplicate_charge'

export type InboxItemType = 'violation' | 'approval' | 'anomaly' | 'budget_alert'
export type ApprovalStatus = 'pending' | 'approved' | 'denied'
export type PolicyStatus = 'compliant' | 'violations' | 'pending_review'
export type AIRecommendation = 'approve' | 'deny' | 'review'

export interface Transaction {
  id: string
  transactionCode: string
  description: string
  category: string
  postingDate: string
  transactionDate: string
  merchantName: string
  amount: number
  debitCredit: 'Debit' | 'Credit'
  mcc: string
  city: string
  country: string
  postalCode: string
  state: string
  conversionRate: number
}

export interface Violation {
  id: string
  transactionId: string
  transaction: Transaction
  relatedTransactions?: Transaction[]
  type: ViolationType
  severity: Severity
  reason: string
  policyRule: string
  amount: number
  merchantName: string
  date: string
  cardNumber: string
}

export interface ApprovalRequest {
  id: string
  transaction: Transaction
  employeeHistory: Transaction[]
  departmentBudget: {
    used: number
    total: number
    remaining: number
    period: string
  }
  aiRecommendation: AIRecommendation
  aiReasoning: string
  status: ApprovalStatus
  requestedAt: string
}

export interface InboxItem {
  id: string
  type: InboxItemType
  severity?: Severity
  title: string
  subtitle: string
  amount: number
  date: string
  aiBrief: string
  cardNumber?: string
  violation?: Violation
  approval?: ApprovalRequest
  isRead: boolean
  isResolved: boolean
}

export interface Trip {
  id: string
  name: string
  startLocation: string
  endLocation: string
  startDate: string
  endDate: string
  transactions: Transaction[]
  totalSpend: number
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
  policyStatus: PolicyStatus
  aiSummary: string
  cardNumber: string
  transactionCount: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  transactions?: Transaction[]
  chartData?: {
    type: 'bar' | 'line' | 'pie'
    title: string
    data: { label: string; value: number; color?: string }[]
  }
  timestamp: Date
  isLoading?: boolean
}

export interface PolicyRule {
  id: string
  title: string
  description: string
  category: string
  threshold?: number
  thresholdUnit?: string
  isActive: boolean
  extractedFrom: string
  severity: Severity
}

export interface SpendSummary {
  totalSpend: number
  transactionCount: number
  avgTransaction: number
  openViolations: number
  pendingApprovals: number
  categoryBreakdown: { category: string; amount: number; color: string }[]
  monthlyTrend: { month: string; amount: number }[]
  topMerchants: { name: string; amount: number; count: number }[]
}
