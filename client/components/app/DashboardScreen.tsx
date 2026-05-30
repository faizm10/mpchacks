"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppShell from "./AppShell";
import { Card, Kpi, HBars, Donut, LineChart, CatDot } from "./ui";
import {
  dashboardKpis,
  monthlySpend,
  categoryBreakdown,
  topMerchants,
  fleetBreakdown,
  complianceResults,
  fmtMoney,
  fleetName,
} from "@/lib/analytics";

export default function DashboardScreen() {
  const kpis = useMemo(() => dashboardKpis(), []);
  const monthly = useMemo(() => monthlySpend(), []);
  const categories = useMemo(() => categoryBreakdown(), []);
  const merchants = useMemo(() => topMerchants(8), []);
  const fleets = useMemo(() => fleetBreakdown(), []);
  const attention = useMemo(
    () =>
      complianceResults()
        .filter((r) => r.status !== "clear")
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5),
    []
  );

  const totalCat = categories.reduce((s, c) => s + c.total, 0);

  return (
    <AppShell
      kicker="Fleet Spend · Command Center"
      title="Dashboard"
      subtitle={`${kpis.txCount.toLocaleString()} transactions · ${kpis.dateRange.start} → ${kpis.dateRange.end} · ${kpis.fleetCount} fleet units across ${kpis.countries} countries`}
      actions={
        <>
          <Link href="/ask" className="ux-btn ux-btn--sm">✦ Ask Brim</Link>
          <Link href="/compliance" className="ux-btn ux-btn--sm ux-btn--primary">⚑ Review {kpis.flaggedCount} flags</Link>
        </>
      }
    >
      {/* KPI band */}
      <div className="ux-kpis" style={{ marginBottom: 16 }}>
        <Kpi label="Total Spend" value={fmtMoney(kpis.totalSpend, { compact: true })} sub={`${kpis.txCount.toLocaleString()} transactions`} accent="var(--accent)" />
        <Kpi label="Avg Transaction" value={fmtMoney(kpis.avgTx, { compact: true })} sub="per charge" accent="#0ea5e9" />
        <Kpi label="Flagged" value={kpis.flaggedCount.toLocaleString()} sub={`${fmtMoney(kpis.flaggedValue, { compact: true })} at risk`} accent="var(--status-high)" />
        <Kpi label="Critical" value={kpis.criticalCount.toLocaleString()} sub="need escalation" accent="var(--status-critical)" />
        <Kpi label="Compliance Rate" value={`${(kpis.complianceRate * 100).toFixed(1)}%`} sub="clean transactions" accent="var(--status-positive)" />
      </div>

      {/* Spend trend + categories */}
      <div className="ux-grid ux-grid--2-1" style={{ marginBottom: 16 }}>
        <Card title="Spend trend" sub={`${monthly.length} months`}>
          <LineChart points={monthly.map((m) => ({ label: m.label, value: m.total }))} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <span>Peak: {monthly.length ? fmtMoney(Math.max(...monthly.map((m) => m.total)), { compact: true }) : "—"}</span>
            <span>Avg/mo: {monthly.length ? fmtMoney(kpis.totalSpend / monthly.length, { compact: true }) : "—"}</span>
          </div>
        </Card>

        <Card title="Spend by category">
          <Donut
            data={categories.slice(0, 6).map((c) => ({ name: c.category, value: c.total, color: c.color }))}
            centerLabel="total"
            centerValue={fmtMoney(totalCat, { compact: true })}
            format={(n) => fmtMoney(n, { compact: true })}
          />
        </Card>
      </div>

      {/* Attention feed + fleet */}
      <div className="ux-grid ux-grid--2-1" style={{ marginBottom: 16 }}>
        <Card
          title="Needs your attention"
          sub="ranked by risk"
          action={<Link href="/compliance" className="ux-btn ux-btn--sm">View all</Link>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attention.map((r) => (
              <Link
                key={r.tx.id}
                href="/compliance"
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  border: "1px solid var(--line-soft)", borderRadius: 8, textDecoration: "none",
                  color: "inherit", borderLeft: `3px solid var(--status-${r.overallSeverity})`,
                }}
              >
                <span className={`sev-badge sev-badge--${r.overallSeverity}`} style={{ flex: "none" }}>
                  {r.overallSeverity}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.tx.merchant}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.violations[0]?.reason ?? r.mccLabel}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, flex: "none" }}>
                  {fmtMoney(r.tx.amount)}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Spend by fleet unit" sub="top units">
          <HBars
            data={fleets.slice(0, 6).map((f) => ({
              name: fleetName(f.code),
              value: f.total,
              color: f.flagged > f.count * 0.5 ? "var(--status-high)" : "var(--accent)",
            }))}
            format={(n) => fmtMoney(n, { compact: true })}
          />
        </Card>
      </div>

      {/* Top merchants */}
      <Card title="Top merchants by spend" sub={`${merchants.length} of all vendors`}>
        <table className="ux-table">
          <thead>
            <tr>
              <th>Merchant</th>
              <th>Category</th>
              <th className="num">Transactions</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => {
              const cat = categories.find((c) => c.category === m.category);
              return (
                <tr key={m.merchant}>
                  <td className="ux-table__merchant">{m.merchant}</td>
                  <td>
                    <span className="ux-pill">
                      <CatDot color={cat?.color ?? "var(--muted)"} />
                      {m.category}
                    </span>
                  </td>
                  <td className="num">{m.count}</td>
                  <td className="num">{fmtMoney(m.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
