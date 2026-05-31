"use client";

import { useMemo, useState } from "react";
import AppShell from "./AppShell";
import { Card, Donut, CatDot } from "./ui";
import {
  complianceResults,
  fmtMoney,
  fleetName,
  categoryOf,
  monthKey,
  monthLabel,
  CATEGORY_COLORS,
  type SpendCategory,
} from "@/lib/analytics";
import { type ComplianceResult } from "@/lib/compliance";

type Report = {
  id: string;
  cardCode: string;
  month: string;
  results: ComplianceResult[];
  total: number;
  flagged: number;
  byCategory: { category: SpendCategory; total: number; color: string }[];
};

function buildReports(): Report[] {
  const groups = new Map<string, ComplianceResult[]>();
  for (const r of complianceResults()) {
    if (r.tx.type === "Credit") continue;
    const key = `${r.tx.cardCode}__${monthKey(r.tx.txDate)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const reports: Report[] = [];
  for (const [key, results] of groups) {
    if (results.length < 3) continue;
    const [cardCode, month] = key.split("__");
    const total = results.reduce((s, r) => s + r.tx.amount, 0);
    const flagged = results.filter((r) => r.status !== "clear").length;
    const catMap = new Map<SpendCategory, number>();
    for (const r of results) {
      const c = categoryOf(r.tx.mcc);
      catMap.set(c, (catMap.get(c) ?? 0) + r.tx.amount);
    }
    const byCategory = [...catMap.entries()]
      .map(([category, total]) => ({ category, total, color: CATEGORY_COLORS[category] }))
      .sort((a, b) => b.total - a.total);
    reports.push({ id: key, cardCode, month, results, total, flagged, byCategory });
  }
  return reports.sort((a, b) => b.total - a.total);
}

export default function ReportsScreen() {
  const reports = useMemo(() => buildReports(), []);
  const [selected, setSelected] = useState<Report | null>(reports[0] ?? null);

  return (
    <AppShell
      kicker="Workflow · Close"
      title="Expense Reports"
      subtitle="Brim auto-groups related charges by fleet unit and period, runs policy checks on every line, and routes for sign-off."
      actions={<span className="ux-pill ux-pill--accent">{reports.length} reports</span>}
    >
      <div className="ux-grid ux-grid--2-1">
        <Card title={selected ? `${fleetName(selected.cardCode)} · ${monthLabel(selected.month)}` : "Report"} sub={selected ? `${selected.results.length} transactions · ${fmtMoney(selected.total)}` : undefined}
          action={selected && <span className={"ux-pill" + (selected.flagged ? "" : " ux-pill--accent")}>{selected.flagged ? `${selected.flagged} need review` : "all clear"}</span>}
        >
          {selected ? (
            <div style={{ overflowX: "auto" }}>
              <table className="ux-table">
                <thead>
                  <tr><th>Date</th><th>Merchant</th><th>Category</th><th className="num">Amount</th><th>Policy</th></tr>
                </thead>
                <tbody>
                  {selected.results.sort((a, b) => a.tx.txDate.localeCompare(b.tx.txDate)).map((r) => {
                    const cat = categoryOf(r.tx.mcc);
                    return (
                      <tr key={r.tx.id}>
                        <td style={{ fontFamily: "var(--mono)", fontSize: 11.5, whiteSpace: "nowrap" }}>{r.tx.txDate}</td>
                        <td className="ux-table__merchant" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.tx.merchant}</td>
                        <td><span className="ux-pill"><CatDot color={CATEGORY_COLORS[cat]} />{cat}</span></td>
                        <td className="num">{fmtMoney(r.tx.amount)}</td>
                        <td>{r.status === "clear" ? <span className="sev-badge sev-badge--clear">ok</span> : <span className={`sev-badge sev-badge--${r.overallSeverity}`}>{r.overallSeverity}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ux-empty"><div className="ux-empty__icon">▤</div>No report selected.</div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {selected && (
            <Card title="Category breakdown">
              <Donut
                data={selected.byCategory.slice(0, 6).map((c) => ({ name: c.category, value: c.total, color: c.color }))}
                centerLabel="total"
                centerValue={fmtMoney(selected.total, { compact: true })}
                format={(n) => fmtMoney(n, { compact: true })}
              />
              <button className="ux-btn ux-btn--primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                ✓ Approve &amp; export to accounting
              </button>
            </Card>
          )}
          <Card title="All reports" sub={`${reports.length}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
              {reports.slice(0, 30).map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelected(rep)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 10px",
                    border: "1px solid var(--line-soft)", borderRadius: 7, cursor: "pointer", textAlign: "left",
                    background: selected?.id === rep.id ? "var(--marker-tint)" : "var(--fill-0)",
                    borderColor: selected?.id === rep.id ? "var(--accent)" : "var(--line-soft)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fleetName(rep.cardCode)}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{monthLabel(rep.month)} · {rep.results.length} tx{rep.flagged ? ` · ${rep.flagged} flagged` : ""}</div>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, flex: "none" }}>{fmtMoney(rep.total, { compact: true })}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
