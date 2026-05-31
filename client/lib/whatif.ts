import { TRANSACTIONS } from "./analytics";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScenarioType =
  | "fleet_purchase"
  | "equipment_upgrade"
  | "headcount"
  | "route_expansion"
  | "vendor_change"
  | "compliance";

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

// ── Preset scenarios (calibrated to ~$216k/mo fleet baseline) ─────────────────

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: "fleet_truck",
    label: "Purchase New Fleet Truck",
    description: "Acquire a long-haul semi — one-time purchase plus ongoing fuel, driver expenses, and maintenance.",
    type: "fleet_purchase",
    icon: "🚛",
    color: "#2f5fd0",
    params: { oneTimeCost: 155000, monthlyDelta: 14500, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "route_expansion",
    label: "Add New Delivery Route",
    description: "Open a new regional route — recurring fuel, tolls, lodging, and driver per-diem from month one.",
    type: "route_expansion",
    icon: "🗺️",
    color: "#0ea5e9",
    params: { oneTimeCost: 8500, monthlyDelta: 26000, startMonthOffset: 1, durationMonths: 0 },
  },
  {
    id: "equipment_upgrade",
    label: "Upgrade Fleet Equipment",
    description: "Replace aging equipment. Higher upfront cost but lower ongoing maintenance spend each month.",
    type: "equipment_upgrade",
    icon: "🔧",
    color: "#f97316",
    params: { oneTimeCost: 72000, monthlyDelta: -7500, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "new_driver",
    label: "Hire Additional Driver",
    description: "Full-time commercial driver — monthly expense reimbursements, fuel card usage, and per-diems.",
    type: "headcount",
    icon: "👤",
    color: "#8b5cf6",
    params: { oneTimeCost: 2000, monthlyDelta: 6200, startMonthOffset: 0, durationMonths: 0 },
  },
  {
    id: "fuel_contract",
    label: "Renegotiate Fuel Contract",
    description: "Lock in a bulk-rate fuel agreement — estimated 6–8% reduction on monthly fuel spend.",
    type: "vendor_change",
    icon: "⛽",
    color: "#22c55e",
    params: { oneTimeCost: 0, monthlyDelta: -13500, startMonthOffset: 2, durationMonths: 0 },
  },
  {
    id: "compliance",
    label: "New Compliance Program",
    description: "Implement a regulatory compliance initiative — audit fees, new permits, and ongoing reporting costs.",
    type: "compliance",
    icon: "⚑",
    color: "#ef4444",
    params: { oneTimeCost: 18500, monthlyDelta: 3200, startMonthOffset: 0, durationMonths: 0 },
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
