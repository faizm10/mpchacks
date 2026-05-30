export interface Employee {
  id: string;
  name: string;
  initials: string;
  department: string;
  role: string;
  yearsAtCompany?: number;
}

export interface Expense {
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  description: string;
  date: string;
  hasReceipt: boolean;
}

export interface Budget {
  total: number;
  used: number;
  remaining: number;
  remainingAfter?: number;
  period: string;
  percentUsed: number;
}

export interface RecentApproval {
  description: string;
  amount: number;
  category: string;
  decision: 'approved' | 'denied';
  date: string;
}

export interface EmployeeHistory {
  totalSpent90d: number;
  avgMonthlySpend: number;
  approvalsRequested12m: number;
  approvalsApproved12m: number;
  approvalsDenied12m: number;
  flaggedTransactions: number;
  commonCategories: string[];
  recentApprovals: RecentApproval[];
}

export interface PolicyRule {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
}

export interface Decision {
  status: 'approved' | 'denied' | 'review';
  note: string;
  decidedAt: string;
}

export interface ApprovalSummary {
  id: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied' | 'review';
  employee: Employee;
  expense: Expense;
  budget: Budget;
  approvalsRequested12m: number;
  approvalsDenied12m: number;
  flaggedTransactions: number;
}

export interface ApprovalDetail extends ApprovalSummary {
  history: EmployeeHistory;
  policies: PolicyRule[];
  decision: Decision | null;
}

export interface AIAnalysis {
  recommendation: 'approve' | 'deny' | 'review';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  headline: string;
  reasoning: string;
  flags: string[];
  positives: string[];
  policyViolations: string[];
  budgetImpact: string;
  patternInsights: string;
  approverAction: string;
  _fallback?: boolean;
}
