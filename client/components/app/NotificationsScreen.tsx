"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "./AppShell";
import { Card } from "./ui";
import { complianceResults, fmtMoney, fleetName } from "@/lib/analytics";

type Notif = {
  id: string;
  type: "critical" | "high" | "approval" | "report";
  icon: string;
  title: string;
  body: string;
  amount?: number;
  date: string;
  href: string;
};

function buildNotifs(): Notif[] {
  const results = complianceResults();
  const notifs: Notif[] = [];

  for (const r of results.filter((x) => x.status === "critical").sort((a, b) => b.tx.amount - a.tx.amount).slice(0, 6)) {
    notifs.push({
      id: `c-${r.tx.id}`, type: "critical", icon: "⚑",
      title: `Critical: ${r.violations[0]?.ruleTitle ?? "policy violation"}`,
      body: `${r.tx.merchant} · ${fleetName(r.tx.cardCode)} — ${r.violations[0]?.reason ?? ""}`,
      amount: r.tx.amount, date: r.tx.txDate, href: "/compliance",
    });
  }
  for (const r of results.filter((x) => x.status === "flagged" && x.overallSeverity === "high").sort((a, b) => b.tx.amount - a.tx.amount).slice(0, 6)) {
    notifs.push({
      id: `h-${r.tx.id}`, type: "high", icon: "▲",
      title: `Approval needed: ${fmtMoney(r.tx.amount)} ${r.mccLabel.toLowerCase()}`,
      body: `${r.tx.merchant} · ${fleetName(r.tx.cardCode)} exceeds policy threshold`,
      amount: r.tx.amount, date: r.tx.txDate, href: "/approvals",
    });
  }
  return notifs.sort((a, b) => b.date.localeCompare(a.date));
}

const TYPE_COLOR: Record<Notif["type"], string> = {
  critical: "var(--status-critical)", high: "var(--status-high)", approval: "var(--accent)", report: "var(--status-positive)",
};

export default function NotificationsScreen() {
  const all = useMemo(() => buildNotifs(), []);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "critical" | "high">("all");

  const list = filter === "all" ? all : all.filter((n) => n.type === filter);
  const unread = all.filter((n) => !read.has(n.id)).length;

  return (
    <AppShell
      kicker="System"
      title="Notifications"
      subtitle="Real-time alerts surfaced by the policy engine — critical violations, approvals waiting, and budget events."
      actions={
        <>
          <span className="ux-pill ux-pill--accent">{unread} unread</span>
          <button className="ux-btn ux-btn--sm" onClick={() => setRead(new Set(all.map((n) => n.id)))}>Mark all read</button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "critical", "high"] as const).map((f) => (
          <button key={f} className="filter-chip" style={filter === f ? { background: f === "all" ? "var(--ink)" : TYPE_COLOR[f], color: "#fff", borderColor: "transparent" } : undefined} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <Card title="Recent activity" sub={`${list.length} alerts`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((n) => {
            const isRead = read.has(n.id);
            return (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setRead((prev) => new Set(prev).add(n.id))}
                style={{
                  display: "flex", gap: 12, padding: "12px 14px", textDecoration: "none", color: "inherit",
                  border: "1px solid var(--line-soft)", borderRadius: 9,
                  borderLeft: `3px solid ${TYPE_COLOR[n.type]}`,
                  background: isRead ? "var(--fill-1)" : "var(--fill-0)", opacity: isRead ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 16, color: TYPE_COLOR[n.type], flex: "none" }}>{n.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{n.body}</div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  {n.amount && <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>{fmtMoney(n.amount)}</div>}
                  <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "var(--mono)" }}>{n.date}</div>
                </div>
                {!isRead && <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLOR[n.type], flex: "none", alignSelf: "center" }} />}
              </Link>
            );
          })}
          {list.length === 0 && <div className="ux-empty"><div className="ux-empty__icon">◔</div>You&apos;re all caught up.</div>}
        </div>
      </Card>
    </AppShell>
  );
}
