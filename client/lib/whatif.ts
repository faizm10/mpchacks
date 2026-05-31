import { TRANSACTIONS } from "./analytics";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScenarioType =
  | "equipment_purchase"
  | "software"
  | "maintenance"
  | "supplies"
  | "vendor_change"
  | "headcount"
  | "compliance"
  | "expansion";

export type ScenarioParams = {
  oneTimeCost: number;       // upfront expense in the start month
  monthlyDelta: number;      // recurring change per month (+spend / -savings)
  startMonthOffset: number;  // months from now before it kicks in (0 = this month)
  durationMonths: number;    // 0 = ongoing indefinitely
};

export type Scenario = {
  id: string;
  label: string;
  description: string;
  type: ScenarioType;
  icon: string;
  color: string;
  params: ScenarioParams;
};

export type ProjectionPoint = {
  label: string;       // e.g. "Jun 26"
  monthIndex: number;  // 0-based from now
  baseline: number;
  projected: number;
  delta: number;
  oneTimeCosts: number;
};

export type ScenarioSummary = {
  totalOneTimeCost: number;
  totalMonthlyDelta: number;
  annualDelta: number;
  annualOneTime: number;
  netAnnualImpact: number;
  breakEvenMonths: number | null;
};

// ── Preset scenarios (calibrated to ~$216k/mo company baseline) ──────────────

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: "office_equipment",
    label: "Office Equipment Purchase",
    description: "Upgrade workstations, monitors, and office furniture for a team expansion or refresh cycle.",
    type: "equipment_purchase",
    icon: "🖥️",
    color: "#2f5fd0",
    params: { oneTimeCost: 28000, monthlyDelta: 600, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "software_subs",
    label: "New Software Subscriptions",
    description: "Add enterprise SaaS tools — project management, analytics, and collaboration platforms.",
    type: "software",
    icon: "💻",
    color: "#8b5cf6",
    params: { oneTimeCost: 2500, monthlyDelta: 3200, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "maintenance_contract",
    label: "Maintenance Contract",
    description: "Annual preventive maintenance program for facilities and equipment — reduces unexpected repair costs over time.",
    type: "maintenance",
    icon: "🔧",
    color: "#f97316",
    params: { oneTimeCost: 6500, monthlyDelta: 4800, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "bulk_supplies",
    label: "Bulk Supplies Order",
    description: "Stock up on operational supplies in bulk — reduces per-unit costs and frequent smaller reorders.",
    type: "supplies",
    icon: "📦",
    color: "#14b8a6",
    params: { oneTimeCost: 15000, monthlyDelta: -1200, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "shipping_renegotiation",
    label: "Renegotiate Shipping Rates",
    description: "Lock in a volume agreement with preferred carriers — estimated 12% reduction on monthly shipping spend.",
    type: "vendor_change",
    icon: "🚚",
    color: "#22c55e",
    params: { oneTimeCost: 0, monthlyDelta: -8500, startMonthOffset: 2, durationMonths: 0 },
  },
  {
    id: "new_employee",
    label: "New Employee (Operations)",
    description: "Hire an operations coordinator — includes monthly expense budget, travel reimbursements, and training.",
    type: "headcount",
    icon: "👤",
    color: "#0ea5e9",
    params: { oneTimeCost: 4500, monthlyDelta: 7200, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "compliance",
    label: "Compliance & Certification",
    description: "Implement a regulatory compliance program — initial audit, certifications, and ongoing renewal costs.",
    type: "compliance",
    icon: "⚑",
    color: "#ef4444",
    params: { oneTimeCost: 12000, monthlyDelta: 1800, startMonthOffset: 0, durationMonths: 0 },
  },
];

// ── Baseline ──────────────────────────────────────────────────────────────────

let _baseline: number | null = null;

export function computeBaseline(): number {
  if (_baseline !== null) return _baseline;

  const byMonth = new Map<string, number>();
  for (const tx of TRANSACTIONS) {
    if (tx.type === "Credit") continue;
    const k = tx.txDate.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + tx.amount);
  }

  if (!byMonth.size) return 0;

  // Use the last 6 full months for a stable average; skip tiny partial months
  const sorted = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, v]) => v > 5000);           // drop stub months
  const recent = sorted.slice(-6);
  _baseline = recent.reduce((s, [, v]) => s + v, 0) / recent.length;
  return _baseline;
}

// ── Projection ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function projectScenarios(
  scenarios: Scenario[],
  enabledIds: Set<string>,
  horizonMonths = 12
): ProjectionPoint[] {
  const baseline = computeBaseline();
  const now = new Date();
  const points: ProjectionPoint[] = [];

  for (let i = 0; i < horizonMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;

    let monthlyDelta = 0;
    let oneTimeCosts = 0;

    for (const s of scenarios) {
      if (!enabledIds.has(s.id)) continue;
      const { oneTimeCost, monthlyDelta: mDelta, startMonthOffset, durationMonths } = s.params;
      if (i < startMonthOffset) continue;

      const monthsActive = i - startMonthOffset;
      if (i === startMonthOffset) oneTimeCosts += oneTimeCost;
      if (durationMonths === 0 || monthsActive < durationMonths) {
        monthlyDelta += mDelta;
      }
    }

    const projected = Math.max(0, baseline + monthlyDelta + oneTimeCosts);

    points.push({
      label,
      monthIndex: i,
      baseline,
      projected,
      delta: projected - baseline,
      oneTimeCosts,
    });
  }

  return points;
}

export function computeSummary(
  scenarios: Scenario[],
  enabledIds: Set<string>
): ScenarioSummary {
  const points = projectScenarios(scenarios, enabledIds, 12);

  const totalOneTimeCost = points.reduce((s, p) => s + p.oneTimeCosts, 0);
  const recurringPoints = points.filter(p => p.oneTimeCosts === 0 || points.indexOf(p) > 0);
  const avgMonthlyDelta =
    recurringPoints.length
      ? recurringPoints.reduce((s, p) => s + (p.delta - (p.oneTimeCosts ?? 0)), 0) /
        recurringPoints.length
      : 0;

  const annualDelta = points.reduce((s, p) => s + p.delta, 0);
  const netAnnualImpact = annualDelta;

  // Break-even: months until cumulative savings offset a one-time cost
  // (only meaningful if monthly delta is negative = savings)
  let breakEvenMonths: number | null = null;
  if (totalOneTimeCost > 0 && avgMonthlyDelta < 0) {
    breakEvenMonths = Math.ceil(totalOneTimeCost / Math.abs(avgMonthlyDelta));
  }

  return {
    totalOneTimeCost,
    totalMonthlyDelta: avgMonthlyDelta,
    annualDelta,
    annualOneTime: totalOneTimeCost,
    netAnnualImpact,
    breakEvenMonths,
  };
}
