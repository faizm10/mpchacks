"use client";

import { useMemo, useState } from "react";
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
