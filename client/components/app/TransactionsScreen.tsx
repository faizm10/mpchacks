"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import AppShell from "./AppShell";
import { Card, CatDot } from "./ui";
import {
  complianceResults,
  categoryOf,
  CATEGORY_COLORS,
  fmtMoney,
  fleetName,
  type SpendCategory,
} from "@/lib/analytics";

const CATEGORIES: (SpendCategory | "All")[] = [
  "All", "Fuel", "Permits & Tolls", "Maintenance", "Lodging", "Meals", "Supplies", "Telecom & Tech", "Shipping", "Other",
];

type SortKey = "date" | "amount" | "risk";

type LedgerInsights = {
  count: number;
  spendTotal: number;
  avg: number;
  topCategory: SpendCategory | null;
  topCategoryTotal: number;
  catShare: number;
  topMerchant: string;
  topMerchantTotal: number;
  largest: { merchant: string; amount: number } | null;
  flaggedCount: number;
  flaggedValue: number;
  clearRate: number;
};

function InsightStat({
  label,
  value,
  sub,
  accent,
  bar,
  valueClassName,
  title,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent: string;
  bar?: number;
  valueClassName?: string;
  title?: string;
}) {
  return (
    <div
      className="ux-insight-stat"
      style={{ "--insight-accent": accent } as CSSProperties}
    >
      <div className="ux-insight-stat__head">
        <span className="ux-insight-stat__dot" aria-hidden />
        <span className="ux-insight-stat__label">{label}</span>
      </div>
      <div
        className={`ux-insight-stat__value${valueClassName ? ` ${valueClassName}` : ""}`}
        title={title}
      >
        {value}
      </div>
      {sub && <div className="ux-insight-stat__sub">{sub}</div>}
      {bar != null && (
        <div className="ux-insight-stat__track" aria-hidden>
          <div className="ux-insight-stat__fill" style={{ width: `${Math.min(bar, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function buildLedgerInsights(filtered: ReturnType<typeof complianceResults>): LedgerInsights | null {
  if (!filtered.length) return null;

  const debits = filtered.filter((r) => r.tx.type !== "Credit");
  const spendTotal = debits.reduce((s, r) => s + r.tx.amount, 0);
  const avg = debits.length ? spendTotal / debits.length : 0;

  const byCategory = new Map<SpendCategory, number>();
  const byMerchant = new Map<string, number>();
  let largest: { merchant: string; amount: number } | null = null;

  for (const r of debits) {
    const cat = categoryOf(r.tx.mcc);
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + r.tx.amount);
    byMerchant.set(r.tx.merchant, (byMerchant.get(r.tx.merchant) ?? 0) + r.tx.amount);
    if (!largest || r.tx.amount > largest.amount) {
      largest = { merchant: r.tx.merchant, amount: r.tx.amount };
    }
  }

  let topCategory: SpendCategory | null = null;
  let topCategoryTotal = 0;
  for (const [cat, total] of byCategory) {
    if (total > topCategoryTotal) {
      topCategory = cat;
      topCategoryTotal = total;
    }
  }

  let topMerchant = "";
  let topMerchantTotal = 0;
  for (const [merchant, total] of byMerchant) {
    if (total > topMerchantTotal) {
      topMerchant = merchant;
      topMerchantTotal = total;
    }
  }

  const flagged = filtered.filter((r) => r.status !== "clear");
  const flaggedValue = flagged.reduce(
    (s, r) => s + (r.tx.type === "Credit" ? 0 : r.tx.amount),
    0,
  );
  const clearRate = (filtered.filter((r) => r.status === "clear").length / filtered.length) * 100;

  const catShare = spendTotal && topCategory ? (topCategoryTotal / spendTotal) * 100 : 0;

  return {
    count: filtered.length,
    spendTotal,
    avg,
    topCategory,
    topCategoryTotal,
    catShare,
    topMerchant,
    topMerchantTotal,
    largest,
    flaggedCount: flagged.length,
    flaggedValue,
    clearRate,
  };
}

export default function TransactionsScreen() {
  const results = useMemo(() => complianceResults(), []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SpendCategory | "All">("All");
  const [status, setStatus] = useState<"all" | "flagged" | "clear">("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [limit, setLimit] = useState(100);

  const filtered = useMemo(() => {
    let list = results;
    if (category !== "All") list = list.filter((r) => categoryOf(r.tx.mcc) === category);
    if (status === "flagged") list = list.filter((r) => r.status !== "clear");
    if (status === "clear") list = list.filter((r) => r.status === "clear");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.tx.merchant.toLowerCase().includes(q) ||
          r.tx.city.toLowerCase().includes(q) ||
          r.tx.state.toLowerCase().includes(q) ||
          r.mccLabel.toLowerCase().includes(q) ||
          r.tx.amount.toString().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "date") sorted.sort((a, b) => b.tx.txDate.localeCompare(a.tx.txDate));
    if (sort === "amount") sorted.sort((a, b) => b.tx.amount - a.tx.amount);
    if (sort === "risk") sorted.sort((a, b) => b.riskScore - a.riskScore);
    return sorted;
  }, [results, category, status, search, sort]);

  const totals = useMemo(() => {
    const sum = filtered.reduce((s, r) => s + (r.tx.type === "Credit" ? -r.tx.amount : r.tx.amount), 0);
    return { count: filtered.length, sum };
  }, [filtered]);

  const insights = useMemo(() => buildLedgerInsights(filtered), [filtered]);

  return (
    <AppShell
      kicker="Ledger"
      title="Transactions"
      subtitle="The raw fleet ledger underneath everything — search, filter, and inspect every charge against policy."
      actions={<span className="ux-pill ux-pill--accent">{totals.count.toLocaleString()} rows · {fmtMoney(totals.sum, { compact: true })}</span>}
    >
      <Card
        action={
          <div style={{ display: "flex", gap: 6 }}>
            {(["date", "amount", "risk"] as SortKey[]).map((s) => (
              <button key={s} className={"ux-btn ux-btn--sm" + (sort === s ? " ux-btn--primary" : "")} onClick={() => setSort(s)}>
                {s === "date" ? "Newest" : s === "amount" ? "Amount" : "Risk"}
              </button>
            ))}
          </div>
        }
        title={
          <div className="ux-input" style={{ width: 300 }}>
            <span className="ux-input__ico">⌕</span>
            <input placeholder="Search merchant, city, category, amount…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {/* Filters */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className="filter-chip"
              style={category === c ? { background: c === "All" ? "var(--accent)" : CATEGORY_COLORS[c as SpendCategory], color: "#fff", borderColor: "transparent" } : undefined}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
          <span style={{ width: 1, background: "var(--line)", margin: "0 4px" }} />
          {(["all", "flagged", "clear"] as const).map((s) => (
            <button
              key={s}
              className="filter-chip"
              style={status === s ? { background: s === "flagged" ? "var(--status-high)" : s === "clear" ? "var(--status-positive)" : "var(--ink)", color: "#fff", borderColor: "transparent" } : undefined}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {insights && (
          <div className="ux-ledger-insights">
            <div className="ux-ledger-insights__head">
              <div className="ux-ledger-insights__brand">
                <span className="ux-ledger-insights__icon" aria-hidden>
                  ✦
                </span>
                <div>
                  <div className="ux-ledger-insights__title">Ledger insights</div>
                  <div className="ux-ledger-insights__sub">Live summary · updates with your filters</div>
                </div>
              </div>
              <span className="ux-ledger-insights__badge">AI summary</span>
            </div>

            <div className="ux-ledger-insights__body">
              <div className="ux-ledger-insights__narrative">
                <p className="ux-ledger-insights__bubble">
                  Across <strong>{insights.count.toLocaleString()}</strong> matching charges totaling{" "}
                  <strong>{fmtMoney(insights.spendTotal, { compact: true })}</strong>
                  {insights.topCategory ? (
                    <>
                      , <strong>{insights.topCategory}</strong> leads at{" "}
                      <strong>{insights.catShare.toFixed(0)}%</strong> of spend (
                      {fmtMoney(insights.topCategoryTotal, { compact: true })}).
                    </>
                  ) : (
                    "."
                  )}{" "}
                  Average charge is <strong>{fmtMoney(insights.avg, { compact: true })}</strong>.
                  {insights.topMerchant ? (
                    <>
                      {" "}
                      Most spend is with{" "}
                      <strong title={insights.topMerchant}>{insights.topMerchant}</strong> (
                      {fmtMoney(insights.topMerchantTotal, { compact: true })}).
                    </>
                  ) : null}
                  {insights.largest ? (
                    <>
                      {" "}
                      Largest single charge: <strong>{fmtMoney(insights.largest.amount)}</strong> at{" "}
                      {insights.largest.merchant}.
                    </>
                  ) : null}
                  {insights.flaggedCount ? (
                    <>
                      {" "}
                      <strong>{insights.flaggedCount.toLocaleString()}</strong> rows flagged (
                      {fmtMoney(insights.flaggedValue, { compact: true })} under review).
                    </>
                  ) : (
                    <> All visible rows are policy-clear.</>
                  )}
                </p>
              </div>

              <div className="ux-ledger-insights__stats">
                <InsightStat
                  label="Total spend"
                  value={fmtMoney(insights.spendTotal, { compact: true })}
                  sub={`${insights.count.toLocaleString()} rows`}
                  accent="var(--accent)"
                />
                <InsightStat
                  label="Average"
                  value={fmtMoney(insights.avg, { compact: true })}
                  sub="per charge"
                  accent="#0ea5e9"
                />
                <InsightStat
                  label="Top category"
                  value={insights.topCategory ?? "—"}
                  sub={
                    insights.topCategory
                      ? fmtMoney(insights.topCategoryTotal, { compact: true })
                      : undefined
                  }
                  accent={
                    insights.topCategory
                      ? CATEGORY_COLORS[insights.topCategory]
                      : "var(--muted)"
                  }
                  bar={insights.catShare}
                />
                <InsightStat
                  label="Top merchant"
                  value={insights.topMerchant || "—"}
                  sub={fmtMoney(insights.topMerchantTotal, { compact: true })}
                  accent="#6366f1"
                  valueClassName="ux-insight-stat__value--sm"
                  title={insights.topMerchant || undefined}
                />
                <InsightStat
                  label="Flagged"
                  value={insights.flaggedCount.toLocaleString()}
                  sub={
                    insights.flaggedCount
                      ? fmtMoney(insights.flaggedValue, { compact: true })
                      : "none"
                  }
                  accent="var(--status-high)"
                  bar={
                    insights.count
                      ? (insights.flaggedCount / insights.count) * 100
                      : undefined
                  }
                />
                <InsightStat
                  label="Clear rate"
                  value={`${insights.clearRate.toFixed(1)}%`}
                  sub="policy clean"
                  accent="var(--status-positive)"
                  bar={insights.clearRate}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table className="ux-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Location</th>
                <th>Fleet Unit</th>
                <th className="num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((r) => {
                const cat = categoryOf(r.tx.mcc);
                return (
                  <tr key={r.tx.id}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11.5, whiteSpace: "nowrap" }}>{r.tx.txDate}</td>
                    <td className="ux-table__merchant" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.tx.merchant}
                    </td>
                    <td>
                      <span className="ux-pill"><CatDot color={CATEGORY_COLORS[cat]} />{cat}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.tx.city}{r.tx.state ? `, ${r.tx.state}` : ""}</td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>{fleetName(r.tx.cardCode)}</td>
                    <td className="num" style={{ color: r.tx.type === "Credit" ? "var(--status-positive)" : undefined }}>
                      {r.tx.type === "Credit" ? "−" : ""}{fmtMoney(r.tx.amount)}
                    </td>
                    <td>
                      {r.status === "clear" ? (
                        <span className="sev-badge sev-badge--clear">clear</span>
                      ) : (
                        <Link href="/compliance" style={{ textDecoration: "none" }}>
                          <span className={`sev-badge sev-badge--${r.overallSeverity}`}>{r.overallSeverity}</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > limit && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button className="ux-btn" onClick={() => setLimit((l) => l + 100)}>
              Load more ({(filtered.length - limit).toLocaleString()} remaining)
            </button>
          </div>
        )}
        {filtered.length === 0 && <div className="ux-empty"><div className="ux-empty__icon">≣</div>No transactions match your filters.</div>}
      </Card>
    </AppShell>
  );
}
