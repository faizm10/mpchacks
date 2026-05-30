"use client";

import { useMemo, useState } from "react";
import AppShell from "./AppShell";
import { Card } from "./ui";
import { complianceResults, fmtMoney, fleetName, categoryOf } from "@/lib/analytics";
import { type ComplianceResult } from "@/lib/compliance";

type Decision = "pending" | "approved" | "denied";

function recommendation(r: ComplianceResult): { verdict: "Approve" | "Review" | "Deny"; reason: string } {
  if (r.status === "critical") return { verdict: "Deny", reason: "Critical policy violation detected — recommend denial pending investigation." };
  const cat = categoryOf(r.tx.mcc);
  if (cat === "Fuel" || cat === "Permits & Tolls" || cat === "Maintenance") {
    return { verdict: "Approve", reason: `Operational ${cat.toLowerCase()} expense consistent with fleet activity. Within normal range for this unit.` };
  }
  if (r.riskScore >= 60) return { verdict: "Review", reason: "Elevated risk score — verify business purpose before approving." };
  return { verdict: "Approve", reason: "Routine expense within policy tolerances." };
}

export default function ApprovalsScreen() {
  const queue = useMemo(
    () =>
      complianceResults()
        .filter((r) => r.tx.amount > 50 && r.status !== "clear")
        .sort((a, b) => b.tx.amount - a.tx.amount)
        .slice(0, 40),
    []
  );
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [selected, setSelected] = useState<ComplianceResult | null>(queue[0] ?? null);

  const pending = queue.filter((r) => (decisions[r.tx.id] ?? "pending") === "pending");
  const decide = (id: string, d: Decision) => setDecisions((prev) => ({ ...prev, [id]: d }));

  const rec = selected ? recommendation(selected) : null;
  const recColor = rec?.verdict === "Approve" ? "var(--status-positive)" : rec?.verdict === "Deny" ? "var(--status-critical)" : "var(--status-medium)";

  return (
    <AppShell
      kicker="Workflow · Decisions"
      title="Pre-Approval Queue"
      subtitle="High-value and flagged charges arrive with full context and an AI recommendation. Decide once."
      actions={<span className="ux-pill ux-pill--accent">{pending.length} pending</span>}
    >
      <div className="ux-grid ux-grid--2-1">
        {/* Queue */}
        <Card title="Awaiting decision" sub={`${pending.length} of ${queue.length}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 560, overflowY: "auto" }}>
            {queue.map((r) => {
              const d = decisions[r.tx.id] ?? "pending";
              const isSel = selected?.tx.id === r.tx.id;
              const rc = recommendation(r);
              return (
                <button
                  key={r.tx.id}
                  onClick={() => setSelected(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", textAlign: "left",
                    border: "1px solid var(--line-soft)", borderRadius: 8, cursor: "pointer",
                    background: isSel ? "var(--marker-tint)" : "var(--fill-0)",
                    borderColor: isSel ? "var(--accent)" : "var(--line-soft)",
                    opacity: d === "pending" ? 1 : 0.55,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.tx.merchant}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{fleetName(r.tx.cardCode)} · {r.tx.txDate}</div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{fmtMoney(r.tx.amount)}</div>
                    {d === "pending" ? (
                      <span className="ux-pill" style={{ fontSize: 9, padding: "1px 7px", borderColor: rc.verdict === "Approve" ? "var(--status-positive)" : rc.verdict === "Deny" ? "var(--status-critical)" : "var(--status-medium)" }}>{rc.verdict}</span>
                    ) : (
                      <span className={`sev-badge sev-badge--${d === "approved" ? "clear" : "critical"}`}>{d}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Detail */}
        {selected && rec ? (
          <Card title="Request detail" sub={selected.tx.id}>
            <div style={{ borderLeft: `4px solid var(--status-${selected.overallSeverity})`, paddingLeft: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.tx.merchant}</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", margin: "2px 0" }}>{fmtMoney(selected.tx.amount)}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{selected.mccLabel} · {selected.tx.city}, {selected.tx.state}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <Field label="Fleet Unit" value={fleetName(selected.tx.cardCode)} />
              <Field label="Date" value={selected.tx.txDate} />
              <Field label="Category" value={categoryOf(selected.tx.mcc)} />
              <Field label="Risk Score" value={String(selected.riskScore)} />
            </div>

            {selected.violations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted)", marginBottom: 8 }}>Policy checks</div>
                {selected.violations.map((v) => (
                  <div key={v.ruleId} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--line-soft)", display: "flex", gap: 8 }}>
                    <span className={`sev-badge sev-badge--${v.severity}`} style={{ flex: "none" }}>{v.severity}</span>
                    <span style={{ color: "var(--ink-soft)" }}>{v.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {/* AI recommendation */}
            <div style={{ background: "var(--marker-tint)", border: "1px solid var(--accent)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--accent-ink)", marginBottom: 4 }}>✦ AI Recommendation</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: recColor }}>{rec.verdict}</div>
              <p style={{ fontSize: 13, color: "var(--accent-ink)", margin: "4px 0 0", lineHeight: 1.5 }}>{rec.reason}</p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ux-btn ux-btn--primary" style={{ flex: 1, justifyContent: "center", background: "var(--status-positive)", borderColor: "var(--status-positive)" }} onClick={() => decide(selected.tx.id, "approved")}>
                ✓ Approve {fmtMoney(selected.tx.amount)}
              </button>
              <button className="ux-btn" style={{ flex: "none" }} onClick={() => decide(selected.tx.id, "denied")}>Deny</button>
            </div>
          </Card>
        ) : (
          <Card title="Request detail"><div className="ux-empty"><div className="ux-empty__icon">◷</div>Select a request to review.</div></Card>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--fill-1)", borderRadius: 7, padding: "8px 11px" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
