import { MCC_LABELS } from "./policy";
import { analyzeTransactions, CARD_NAMES, type Transaction, type ComplianceResult } from "./compliance";
import rawData from "./transactions.json";

export const TRANSACTIONS = rawData as Transaction[];

// ─── Domain: this is a trucking / logistics fleet ──────────────────────────────
// Card codes = fleet units/drivers. MCC codes group into operational categories.

export type SpendCategory =
  | "Fuel"
  | "Permits & Tolls"
  | "Maintenance"
  | "Lodging"
  | "Meals"
  | "Supplies"
  | "Shipping"
  | "Telecom & Tech"
  | "Other";

const CATEGORY_MCC: Record<SpendCategory, number[]> = {
  Fuel: [5541, 5542, 5983],
  "Permits & Tolls": [9399, 4784, 9211, 9222],
  Maintenance: [7538, 7542, 5533, 5532, 7549, 5013, 5511, 5571, 7531],
  Lodging: [7011, 3500, 3501],
  Meals: [5812, 5813, 5814, 5811, 5462, 5499],
  Supplies: [5046, 5085, 5251, 5300, 5200, 5045, 5734, 5947, 5111, 5021],
  Shipping: [4215, 4214],
  "Telecom & Tech": [4816, 4812, 4899, 4814, 5732],
  Other: [],
};

const MCC_TO_CATEGORY: Record<number, SpendCategory> = {};
for (const [cat, codes] of Object.entries(CATEGORY_MCC) as [SpendCategory, number[]][]) {
  for (const c of codes) MCC_TO_CATEGORY[c] = cat;
}

export function categoryOf(mcc: number): SpendCategory {
  return MCC_TO_CATEGORY[mcc] ?? "Other";
}

export const CATEGORY_COLORS: Record<SpendCategory, string> = {
  Fuel: "#2f5fd0",
  "Permits & Tolls": "#0ea5e9",
  Maintenance: "#f97316",
  Lodging: "#8b5cf6",
  Meals: "#eab308",
  Supplies: "#14b8a6",
  Shipping: "#ec4899",
  "Telecom & Tech": "#64748b",
  Other: "#a4a199",
};

// Fleet unit display names (trucking context)
export const FLEET_NAMES: Record<string, string> = {
  "3001": "Fleet Unit 3001 · Main",
  "3005": "Fleet Unit 3005",
  "3006": "Fleet Unit 3006",
  "3035": "Fleet Unit 3035",
  "404": "Fleet Unit 404",
  "137": "Fleet Unit 137",
  "108": "Fleet Unit 108",
  "375": "Fleet Unit 375",
  "401": "Fleet Unit 401",
};

export function fleetName(code: string): string {
  return FLEET_NAMES[code] ?? CARD_NAMES[code] ?? `Card ${code}`;
}

// ─── Core money helpers ────────────────────────────────────────────────────────

/** Net amount in CAD-equivalent. Debits positive, credits negative. */
export function signedAmount(tx: Transaction): number {
  return tx.type === "Credit" ? -tx.amount : tx.amount;
}

export function fmtMoney(n: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  }
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

// ─── Aggregations (memoized singletons) ────────────────────────────────────────

let _results: ComplianceResult[] | null = null;
export function complianceResults(): ComplianceResult[] {
  if (!_results) _results = analyzeTransactions(TRANSACTIONS);
  return _results;
}

export type MonthlyPoint = { key: string; label: string; total: number; count: number };

export function monthlySpend(): MonthlyPoint[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const tx of TRANSACTIONS) {
    if (tx.type === "Credit") continue;
    const k = monthKey(tx.txDate);
    const cur = map.get(k) ?? { total: 0, count: 0 };
    cur.total += tx.amount;
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: monthLabel(key), total: v.total, count: v.count }));
}

export type CategoryStat = { category: SpendCategory; total: number; count: number; color: string };

export function categoryBreakdown(): CategoryStat[] {
  const map = new Map<SpendCategory, { total: number; count: number }>();
  for (const tx of TRANSACTIONS) {
    if (tx.type === "Credit") continue;
    const cat = categoryOf(tx.mcc);
    const cur = map.get(cat) ?? { total: 0, count: 0 };
    cur.total += tx.amount;
    cur.count += 1;
    map.set(cat, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, ...v, color: CATEGORY_COLORS[category] }))
    .sort((a, b) => b.total - a.total);
}

export type MerchantStat = { merchant: string; total: number; count: number; category: SpendCategory };

export function topMerchants(limit = 12): MerchantStat[] {
  const map = new Map<string, { total: number; count: number; mcc: number }>();
  for (const tx of TRANSACTIONS) {
    if (tx.type === "Credit") continue;
    const cur = map.get(tx.merchant) ?? { total: 0, count: 0, mcc: tx.mcc };
    cur.total += tx.amount;
    cur.count += 1;
    map.set(tx.merchant, cur);
  }
  return [...map.entries()]
    .map(([merchant, v]) => ({ merchant, total: v.total, count: v.count, category: categoryOf(v.mcc) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export type FleetStat = {
  code: string;
  name: string;
  total: number;
  count: number;
  flagged: number;
  flaggedValue: number;
};

export function fleetBreakdown(): FleetStat[] {
  const results = complianceResults();
  const map = new Map<string, FleetStat>();
  for (const r of results) {
    const tx = r.tx;
    if (tx.type === "Credit") continue;
    const cur =
      map.get(tx.cardCode) ??
      { code: tx.cardCode, name: fleetName(tx.cardCode), total: 0, count: 0, flagged: 0, flaggedValue: 0 };
    cur.total += tx.amount;
    cur.count += 1;
    if (r.status !== "clear") {
      cur.flagged += 1;
      cur.flaggedValue += tx.amount;
    }
    map.set(tx.cardCode, cur);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export type DashboardKpis = {
  totalSpend: number;
  txCount: number;
  avgTx: number;
  flaggedCount: number;
  flaggedValue: number;
  criticalCount: number;
  complianceRate: number;
  fleetCount: number;
  countries: number;
  dateRange: { start: string; end: string };
};

export function dashboardKpis(): DashboardKpis {
  const results = complianceResults();
  let totalSpend = 0;
  let txCount = 0;
  let flaggedCount = 0;
  let flaggedValue = 0;
  let criticalCount = 0;
  const dates: string[] = [];
  const countries = new Set<string>();
  const fleets = new Set<string>();

  for (const r of results) {
    const tx = r.tx;
    if (tx.type === "Credit") continue;
    totalSpend += tx.amount;
    txCount += 1;
    dates.push(tx.txDate);
    if (tx.country) countries.add(tx.country);
    fleets.add(tx.cardCode);
    if (r.status !== "clear") {
      flaggedCount += 1;
      flaggedValue += tx.amount;
    }
    if (r.status === "critical") criticalCount += 1;
  }
  dates.sort();
  return {
    totalSpend,
    txCount,
    avgTx: txCount ? totalSpend / txCount : 0,
    flaggedCount,
    flaggedValue,
    criticalCount,
    complianceRate: txCount ? (txCount - flaggedCount) / txCount : 1,
    fleetCount: fleets.size,
    countries: countries.size,
    dateRange: { start: dates[0] ?? "", end: dates[dates.length - 1] ?? "" },
  };
}

export { MCC_LABELS };
