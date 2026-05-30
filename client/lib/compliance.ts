import { POLICY_RULES, MCC_LABELS, type Severity } from "./policy";

export type Transaction = {
  id: string;
  cardCode: string;
  description: string;
  merchant: string;
  amount: number;
  type: string;
  mcc: number;
  city: string;
  country: string;
  state: string;
  txDate: string;
  postDate: string;
  convRate: number;
};

export type Violation = {
  ruleId: string;
  ruleTitle: string;
  severity: Severity;
  confidence: number;
  reason: string;
  recommendation: string;
  linkedTxIds?: string[];
};

export type ComplianceResult = {
  tx: Transaction;
  status: "clear" | "flagged" | "critical";
  overallSeverity: Severity | null;
  violations: Violation[];
  riskScore: number;
  mccLabel: string;
  aiContext?: string;
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 100,
  high: 60,
  medium: 30,
  low: 10,
};

function computeStatus(violations: Violation[]): "clear" | "flagged" | "critical" {
  if (!violations.length) return "clear";
  if (violations.some((v) => v.severity === "critical")) return "critical";
  return "flagged";
}

function topSeverity(violations: Violation[]): Severity | null {
  if (!violations.length) return null;
  const order: Severity[] = ["critical", "high", "medium", "low"];
  for (const s of order) {
    if (violations.some((v) => v.severity === s)) return s;
  }
  return null;
}

function riskScore(violations: Violation[]): number {
  if (!violations.length) return 0;
  const raw = violations.reduce((sum, v) => sum + SEVERITY_WEIGHT[v.severity] * v.confidence, 0);
  return Math.min(100, Math.round(raw));
}

export function analyzeTransactions(transactions: Transaction[]): ComplianceResult[] {
  // Build lookup maps for split-charge detection
  const byCardAndMerchant: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    if (tx.type !== "Debit") continue;
    const key = `${tx.cardCode}||${normalizeMerchant(tx.merchant)}`;
    if (!byCardAndMerchant[key]) byCardAndMerchant[key] = [];
    byCardAndMerchant[key].push(tx);
  }

  return transactions.map((tx) => {
    const violations: Violation[] = [];
    const rule = (id: string) => POLICY_RULES.find((r) => r.id === id)!;

    // Only analyze debits
    if (tx.type === "Credit") {
      return {
        tx,
        status: "clear",
        overallSeverity: null,
        violations: [],
        riskScore: 0,
        mccLabel: MCC_LABELS[tx.mcc] ?? "Unknown",
      };
    }

    // Rule: Pre-authorization threshold ($50)
    if (tx.amount > 50) {
      const r = rule("approval_threshold");
      const confidence = tx.amount > 500 ? 0.95 : tx.amount > 200 ? 0.85 : 0.75;
      violations.push({
        ruleId: r.id,
        ruleTitle: r.title,
        severity: tx.amount > 500 ? "high" : "medium",
        confidence,
        reason: `$${tx.amount.toFixed(2)} exceeds the $50 pre-authorization threshold`,
        recommendation: r.recommendation,
      });
    }

    // Rule: Split charge detection
    const splitKey = `${tx.cardCode}||${normalizeMerchant(tx.merchant)}`;
    const sameMerchantTxs = byCardAndMerchant[splitKey] ?? [];
    if (sameMerchantTxs.length > 1) {
      // Find transactions within 24h of this one
      const txTime = new Date(tx.txDate).getTime();
      const nearby = sameMerchantTxs.filter((t) => {
        if (t.id === tx.id) return false;
        const diff = Math.abs(new Date(t.txDate).getTime() - txTime);
        return diff <= 24 * 60 * 60 * 1000;
      });
      if (nearby.length > 0) {
        const combined = nearby.reduce((s, t) => s + t.amount, 0) + tx.amount;
        if (combined > 200 && tx.amount < 500 && combined > tx.amount * 1.3) {
          const r = rule("split_charge");
          violations.push({
            ruleId: r.id,
            ruleTitle: r.title,
            severity: combined > 1000 ? "critical" : "high",
            confidence: 0.88,
            reason: `${nearby.length + 1} charges at ${normalizeMerchant(tx.merchant)} within 24h totaling $${combined.toFixed(2)}`,
            recommendation: r.recommendation,
            linkedTxIds: nearby.map((t) => t.id),
          });
        }
      }
    }

    // Rule: Meal over limit
    const MEAL_MCCS = [5812, 5814, 5811];
    if (MEAL_MCCS.includes(tx.mcc) && tx.amount > 75) {
      const r = rule("meal_over_limit");
      violations.push({
        ruleId: r.id,
        ruleTitle: r.title,
        severity: tx.amount > 300 ? "high" : "medium",
        confidence: tx.amount > 200 ? 0.9 : 0.7,
        reason: `$${tx.amount.toFixed(2)} meal expense — policy requires justification above $75/person`,
        recommendation: r.recommendation,
      });
    }

    // Rule: Personal / restricted merchant categories
    const PERSONAL_MCCS = [5947, 7922, 7832];
    if (PERSONAL_MCCS.includes(tx.mcc)) {
      const r = rule("personal_expense");
      violations.push({
        ruleId: r.id,
        ruleTitle: r.title,
        severity: "high",
        confidence: 0.85,
        reason: `${MCC_LABELS[tx.mcc] ?? "Merchant category"} is not a recognized business expense category`,
        recommendation: r.recommendation,
      });
    }

    // Rule: Restricted merchants (ATM / cash advance)
    const RESTRICTED_MCCS = [6011, 7995];
    if (RESTRICTED_MCCS.includes(tx.mcc)) {
      const r = rule("restricted_merchant");
      violations.push({
        ruleId: r.id,
        ruleTitle: r.title,
        severity: "critical",
        confidence: 0.95,
        reason: `${MCC_LABELS[tx.mcc] ?? "Merchant type"} is explicitly prohibited under Brim expense policy`,
        recommendation: r.recommendation,
      });
    }

    // Rule: Large transaction ($1000+)
    if (tx.amount >= 1000 && !violations.some((v) => v.ruleId === "split_charge")) {
      const r = rule("large_transaction");
      violations.push({
        ruleId: r.id,
        ruleTitle: r.title,
        severity: tx.amount >= 5000 ? "high" : "medium",
        confidence: 0.8,
        reason: `$${tx.amount.toFixed(2)} is a high-value transaction requiring additional scrutiny`,
        recommendation: r.recommendation,
      });
    }

    // Rule: Entertainment missing guest info
    const ENTERTAINMENT_MCCS = [5812, 5813, 5814, 7011];
    if (ENTERTAINMENT_MCCS.includes(tx.mcc) && tx.amount > 100) {
      const r = rule("entertainment_missing_info");
      violations.push({
        ruleId: r.id,
        ruleTitle: r.title,
        severity: "medium",
        confidence: 0.65,
        reason: `${tx.amount > 300 ? "High-value" : ""} entertainment expense — guest names and business purpose required`,
        recommendation: r.recommendation,
      });
    }

    // Deduplicate violations (keep highest severity per rule category)
    const seen = new Set<string>();
    const deduped = violations.filter((v) => {
      if (seen.has(v.ruleId)) return false;
      seen.add(v.ruleId);
      return true;
    });

    return {
      tx,
      status: computeStatus(deduped),
      overallSeverity: topSeverity(deduped),
      violations: deduped,
      riskScore: riskScore(deduped),
      mccLabel: MCC_LABELS[tx.mcc] ?? "Unknown",
    };
  });
}

function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+#\d+.*$/, "")
    .replace(/\s+\d{3,}.*$/, "")
    .replace(/\*.*$/, "")
    .trim();
}

// Card code → display name mapping for UI
export const CARD_NAMES: Record<string, string> = {
  "3001": "Driver · Fleet A",
  "404": "Driver · Fleet B",
  "137": "Driver · Fleet C",
  "3006": "Driver · Fleet D",
  "108": "Driver · Fleet E",
  "375": "Driver · Fleet F",
  "401": "Driver · Fleet G",
  "3005": "Driver · Fleet H",
  "3035": "Driver · Fleet I",
};
