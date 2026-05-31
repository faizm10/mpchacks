import { TRANSACTIONS, categoryOf, type SpendCategory } from "./analytics";

export type RecurringBill = {
  merchant: string;
  dayOfMonth: number;
  avgAmount: number;
  category: SpendCategory;
  occurrences: number;
};

export type DayData = {
  date: string;
  day: number;
  isToday: boolean;
  isFuture: boolean;
  spend: number;
  income: number;
  txCount: number;
  bills: RecurringBill[];
  zone: "safe" | "caution" | "high";
};

export type MonthData = {
  year: number;
  month: number;
  label: string;
  days: DayData[];
  totalSpend: number;
  totalIncome: number;
  recurringBills: RecurringBill[];
  safeDayCount: number;
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Collapse merchant name noise (numbers, special chars) so "SHELL 1234" == "SHELL 5678"
function normMerchant(m: string): string {
  return m.replace(/[0-9*#\-\/\\]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 30).toUpperCase();
}

let _bills: RecurringBill[] | null = null;

export function detectRecurringBills(): RecurringBill[] {
  if (_bills) return _bills;

  const byMerchant = new Map<
    string,
    { months: Set<string>; days: number[]; amounts: number[]; mcc: number }
  >();

  for (const tx of TRANSACTIONS) {
    if (tx.type !== "Debit") continue;
    const key = normMerchant(tx.merchant);
    const cur = byMerchant.get(key) ?? { months: new Set(), days: [], amounts: [], mcc: tx.mcc };
    cur.months.add(tx.txDate.slice(0, 7));
    cur.days.push(parseInt(tx.txDate.slice(8, 10), 10));
    cur.amounts.push(tx.amount);
    byMerchant.set(key, cur);
  }

  const result: RecurringBill[] = [];

  for (const [merchant, data] of byMerchant) {
    // Must appear across at least 2 distinct calendar months
    if (data.months.size < 2) continue;

    const n = data.days.length;
    const avgDay = data.days.reduce((s, d) => s + d, 0) / n;
    const stdDev = Math.sqrt(data.days.reduce((s, d) => s + (d - avgDay) ** 2, 0) / n);

    // Consistent day-of-month: stddev < 5 days
    if (stdDev > 4.5) continue;

    const avgAmount = data.amounts.reduce((s, a) => s + a, 0) / data.amounts.length;

    result.push({
      merchant,
      dayOfMonth: Math.round(avgDay),
      avgAmount,
      category: categoryOf(data.mcc),
      occurrences: data.months.size,
    });
  }

  _bills = result.sort((a, b) => b.avgAmount - a.avgAmount).slice(0, 25);
  return _bills;
}

export function getCashFlowMonth(year: number, month: number): MonthData {
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStr = `${year}-${pad(month)}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const recurringBills = detectRecurringBills();

  // Aggregate actual transactions per day
  const dailyMap = new Map<string, { spend: number; income: number; count: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(`${monthStr}-${pad(d)}`, { spend: 0, income: 0, count: 0 });
  }
  for (const tx of TRANSACTIONS) {
    if (!tx.txDate.startsWith(monthStr)) continue;
    const entry = dailyMap.get(tx.txDate);
    if (!entry) continue;
    if (tx.type === "Credit") entry.income += tx.amount;
    else { entry.spend += tx.amount; entry.count += 1; }
  }

  const maxSpend = Math.max(...[...dailyMap.values()].map(d => d.spend), 1);

  let totalSpend = 0;
  let totalIncome = 0;
  let safeDayCount = 0;
  const days: DayData[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthStr}-${pad(d)}`;
    const entry = dailyMap.get(dateStr)!;
    const isFuture = dateStr > today;

    // Bills whose typical day-of-month falls within ±1 day
    const bills = recurringBills.filter(b => Math.abs(b.dayOfMonth - d) <= 1);
    const hasBigBill = bills.some(b => b.avgAmount > 500);

    let zone: DayData["zone"];
    if (isFuture) {
      // No actual data — score purely from expected bills
      zone = hasBigBill ? "high" : bills.length > 0 ? "caution" : "safe";
    } else {
      const spendRatio = entry.spend / maxSpend;
      if (hasBigBill || spendRatio > 0.55) zone = "high";
      else if (bills.length > 0 || entry.income > 0 || spendRatio > 0.20) zone = "caution";
      else zone = "safe";
    }

    if (zone === "safe") safeDayCount++;

    totalSpend += entry.spend;
    totalIncome += entry.income;

    days.push({
      date: dateStr,
      day: d,
      isToday: dateStr === today,
      isFuture,
      spend: entry.spend,
      income: entry.income,
      txCount: entry.count,
      bills,
      zone,
    });
  }

  return {
    year,
    month,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    days,
    totalSpend,
    totalIncome,
    recurringBills,
    safeDayCount,
  };
}

export function getAvailableMonths(): { year: number; month: number; label: string }[] {
  const keys = [...new Set(TRANSACTIONS.map(tx => tx.txDate.slice(0, 7)))].sort();
  return keys.map(k => {
    const [y, m] = k.split("-").map(Number);
    return { year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}` };
  });
}
