import {
  categoryOf,
  complianceResults,
  fleetName,
  fmtMoney,
  monthKey,
  type SpendCategory,
} from "@/lib/analytics";
import type { ComplianceResult, Transaction } from "@/lib/compliance";

export type DocCheckItem = {
  id: string;
  label: string;
  detail: string;
  required: boolean;
  satisfied: boolean;
};

export type FleetSpendHistory = {
  ytdTotal: number;
  ytdCount: number;
  monthTotal: number;
  monthCount: number;
  categoryTotal: number;
  categoryCount: number;
  flaggedYtd: number;
  avgTxAmount: number;
  recentSameCategory: { merchant: string; amount: number; date: string }[];
};

export type FleetBudgetStatus = {
  monthLabel: string;
  budgetTotal: number;
  spent: number;
  remaining: number;
  pctUsed: number;
  requestPctOfRemaining: number;
};

export type ApprovalContext = {
  fleet: FleetSpendHistory;
  budget: FleetBudgetStatus;
  docs: DocCheckItem[];
  waitingHours: number;
  businessPurpose: string;
  receiptAttached: boolean;
  preAuthorized: boolean;
};

const FLEET_MONTHLY_BUDGET: Record<string, number> = {
  "3001": 85000,
  "3002": 62000,
  "3003": 48000,
  "3004": 72000,
  "3005": 55000,
};

function fleetBudgetFor(cardCode: string, monthSpend: number): number {
  const seeded = FLEET_MONTHLY_BUDGET[cardCode];
  if (seeded) return seeded;
  return Math.max(monthSpend * 1.25, 40000);
}

function pseudoReceipt(tx: Transaction): boolean {
  const h = tx.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return h % 3 !== 0;
}

function pseudoPreAuth(tx: Transaction): boolean {
  if (tx.amount <= 50) return true;
  const h = tx.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return h % 5 === 0;
}

function businessPurpose(tx: Transaction, cat: SpendCategory): string {
  const unit = fleetName(tx.cardCode);
  switch (cat) {
    case "Maintenance":
      return `Scheduled maintenance and parts for ${unit} — vendor ${tx.merchant.split("*")[0]?.trim() || tx.merchant}.`;
    case "Fuel":
      return `Fuel purchase for ${unit} route operations.`;
    case "Lodging":
      return `Lodging for ${unit} field operations.`;
    case "Meals":
      return `Meals during active route / crew shift for ${unit}.`;
    default:
      return `Operational spend for ${unit} — ${cat.toLowerCase()} category.`;
  }
}

export function waitingHoursFor(txDate: string): number {
  const txDateObj = new Date(txDate + "T12:00:00");
  const now = new Date("2025-10-22T12:00:00");
  return Math.max(1, Math.round((now.getTime() - txDateObj.getTime()) / 3_600_000));
}

export function buildApprovalContext(result: ComplianceResult): ApprovalContext {
  const tx = result.tx;
  const cat = categoryOf(tx.mcc);
  const mk = monthKey(tx.txDate);
  const all = complianceResults().filter((r) => r.tx.cardCode === tx.cardCode && r.tx.type !== "Credit");

  let ytdTotal = 0;
  let ytdCount = 0;
  let monthTotal = 0;
  let monthCount = 0;
  let categoryTotal = 0;
  let categoryCount = 0;
  let flaggedYtd = 0;
  const recentSameCategory: { merchant: string; amount: number; date: string }[] = [];

  for (const r of all) {
    const t = r.tx;
    ytdTotal += t.amount;
    ytdCount += 1;
    if (monthKey(t.txDate) === mk) {
      monthTotal += t.amount;
      monthCount += 1;
    }
    if (categoryOf(t.mcc) === cat) {
      categoryTotal += t.amount;
      categoryCount += 1;
      if (t.id !== tx.id && recentSameCategory.length < 4) {
        recentSameCategory.push({ merchant: t.merchant, amount: t.amount, date: t.txDate });
      }
    }
    if (r.status !== "clear") flaggedYtd += 1;
  }

  const budgetTotal = fleetBudgetFor(tx.cardCode, monthTotal);
  const spent = monthTotal;
  const remaining = Math.max(budgetTotal - spent, 0);
  const pctUsed = budgetTotal ? (spent / budgetTotal) * 100 : 0;
  const requestPctOfRemaining = remaining > 0 ? (tx.amount / remaining) * 100 : 100;

  const receiptAttached = pseudoReceipt(tx);
  const preAuthorized = pseudoPreAuth(tx);

  const violationIds = new Set(result.violations.map((v) => v.ruleId));

  const docs: DocCheckItem[] = [
    {
      id: "receipt",
      label: "Receipt or invoice on file",
      detail: "Brim policy requires documentation before reimbursement.",
      required: violationIds.has("receipt_required") || tx.amount > 50,
      satisfied: receiptAttached,
    },
    {
      id: "preauth",
      label: "Manager pre-authorization",
      detail: "Expenses over $50 need documented approval before the charge.",
      required: violationIds.has("approval_threshold") || tx.amount > 50,
      satisfied: preAuthorized,
    },
    {
      id: "purpose",
      label: "Business purpose documented",
      detail: "Approver can verify why this spend supports fleet operations.",
      required: true,
      satisfied: true,
    },
  ];

  if (violationIds.has("entertainment_missing_info")) {
    docs.push({
      id: "guests",
      label: "Guest names & entertainment purpose",
      detail: "Policy requires attendee list and business justification for client meals.",
      required: true,
      satisfied: false,
    });
  }

  if (violationIds.has("large_transaction")) {
    docs.push({
      id: "justification",
      label: "High-value written justification",
      detail: "Large transactions need explicit sign-off beyond standard pre-auth.",
      required: true,
      satisfied: preAuthorized && receiptAttached,
    });
  }

  const waitingHours = waitingHoursFor(tx.txDate);

  return {
    fleet: {
      ytdTotal,
      ytdCount,
      monthTotal,
      monthCount,
      categoryTotal,
      categoryCount,
      flaggedYtd,
      avgTxAmount: ytdCount ? ytdTotal / ytdCount : 0,
      recentSameCategory,
    },
    budget: {
      monthLabel: mk,
      budgetTotal,
      spent,
      remaining,
      pctUsed,
      requestPctOfRemaining,
    },
    docs,
    waitingHours,
    businessPurpose: businessPurpose(tx, cat),
    receiptAttached,
    preAuthorized,
  };
}

export function formatBudgetLine(b: FleetBudgetStatus): string {
  return `${fmtMoney(b.remaining)} remaining of ${fmtMoney(b.budgetTotal)}`;
}
