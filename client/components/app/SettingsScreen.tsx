"use client";

import { useMemo, useState } from "react";
import AppShell from "./AppShell";
import { Card } from "./ui";
import { POLICY_RULES } from "@/lib/policy";
import { complianceResults } from "@/lib/analytics";

export default function SettingsScreen() {
  const [tab, setTab] = useState<"policy" | "workspace">("policy");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(POLICY_RULES.map((r) => [r.id, true]))
  );

  // How many transactions each rule actually flags (impact preview)
  const ruleImpact = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of complianceResults()) {
      for (const v of r.violations) counts[v.ruleId] = (counts[v.ruleId] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <AppShell
      kicker="System"
      title="Settings"
      subtitle="Manage the policy rules that power the compliance engine and configure your workspace."
      actions={
        <div style={{ display: "flex", gap: 6 }}>
          <button className={"ux-btn ux-btn--sm" + (tab === "policy" ? " ux-btn--primary" : "")} onClick={() => setTab("policy")}>Policy Rules</button>
          <button className={"ux-btn ux-btn--sm" + (tab === "workspace" ? " ux-btn--primary" : "")} onClick={() => setTab("workspace")}>Workspace</button>
        </div>
      }
    >
      {tab === "policy" ? (
        <Card title="Policy rules" sub={`${POLICY_RULES.length} rules · derived from Brim Expense Policy`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {POLICY_RULES.map((rule) => {
              const on = enabled[rule.id];
              const impact = ruleImpact[rule.id] ?? 0;
              return (
                <div
                  key={rule.id}
                  style={{
                    display: "flex", gap: 14, padding: "14px 16px", border: "1px solid var(--line-soft)", borderRadius: 10,
                    borderLeft: `3px solid var(--status-${rule.severity})`, opacity: on ? 1 : 0.55,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{rule.title}</span>
                      <span className={`sev-badge sev-badge--${rule.severity}`}>{rule.severity}</span>
                      <span className="ux-pill" style={{ fontSize: 10 }}>{rule.category}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 6px", lineHeight: 1.5 }}>{rule.description}</p>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      → {rule.recommendation}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--accent-ink)", marginTop: 6, fontFamily: "var(--mono)" }}>
                      ↻ Currently flags {impact.toLocaleString()} transactions
                    </div>
                  </div>
                  <button
                    onClick={() => setEnabled((p) => ({ ...p, [rule.id]: !p[rule.id] }))}
                    style={{
                      flex: "none", width: 44, height: 24, borderRadius: 13, border: "none", cursor: "pointer",
                      background: on ? "var(--status-positive)" : "var(--line-strong)", position: "relative", transition: "background .15s",
                      alignSelf: "center",
                    }}
                    aria-label={on ? "Disable rule" : "Enable rule"}
                  >
                    <span style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="ux-grid ux-grid--2">
          <Card title="Workspace">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SettingRow label="Company" value="Brim Logistics" />
              <SettingRow label="Plan" value="Fleet · Enterprise" />
              <SettingRow label="Base currency" value="CAD" />
              <SettingRow label="Fleet units" value="9 active cards" />
              <SettingRow label="Policy document" value="Brim Expense Policy.pdf" />
            </div>
          </Card>
          <Card title="AI engine">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SettingRow label="Reasoning model" value="Gemini" />
              <SettingRow label="Auto-flag threshold" value="$50.00" />
              <SettingRow label="Split-charge window" value="24 hours" />
              <SettingRow label="Critical escalation" value="ATM / cash advance, gambling" />
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
