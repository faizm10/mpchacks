"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "./AppShell";
import { complianceResults, fmtMoney, fleetName } from "@/lib/analytics";

type Notif = {
  id: string;
  type: "critical" | "high" | "approval" | "report";
  title: string;
  body: string;
  amount?: number;
  date: string;
  href: string;
};

type Filter = "all" | "critical" | "high";

const SEV_CLASS: Record<Notif["type"], string> = {
  critical: "sev-badge--critical",
  high: "sev-badge--high",
  approval: "sev-badge--medium",
  report: "sev-badge--clear",
};

const SEV_LABEL: Record<Notif["type"], string> = {
  critical: "Critical",
  high: "Approval",
  approval: "Approval",
  report: "Report",
};

function buildNotifs(): Notif[] {
  const results = complianceResults();
  const notifs: Notif[] = [];

  for (const r of results
    .filter((x) => x.status === "critical")
    .sort((a, b) => b.tx.amount - a.tx.amount)
    .slice(0, 6)) {
    notifs.push({
      id: `c-${r.tx.id}`,
      type: "critical",
      title: r.violations[0]?.ruleTitle ?? "Policy violation",
      body: `${r.tx.merchant} · ${fleetName(r.tx.cardCode)} — ${r.violations[0]?.reason ?? ""}`,
      amount: r.tx.amount,
      date: r.tx.txDate,
      href: "/compliance",
    });
  }
  for (const r of results
    .filter((x) => x.status === "flagged" && x.overallSeverity === "high")
    .sort((a, b) => b.tx.amount - a.tx.amount)
    .slice(0, 6)) {
    notifs.push({
      id: `h-${r.tx.id}`,
      type: "high",
      title: `${fmtMoney(r.tx.amount)} ${r.mccLabel.toLowerCase()} needs approval`,
      body: `${r.tx.merchant} · ${fleetName(r.tx.cardCode)} exceeds policy threshold`,
      amount: r.tx.amount,
      date: r.tx.txDate,
      href: "/approvals",
    });
  }
  return notifs.sort((a, b) => b.date.localeCompare(a.date));
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsScreen() {
  const all = useMemo(() => buildNotifs(), []);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");

  const list = filter === "all" ? all : all.filter((n) => n.type === filter);
  const unread = all.filter((n) => !read.has(n.id)).length;

  return (
    <AppShell
      title="Notifications"
      subtitle="Policy alerts and approvals waiting on your fleet."
      actions={
        unread > 0 ? (
          <span className="ux-notif-unread">{unread} unread</span>
        ) : (
          <span className="ux-notif-unread ux-notif-unread--clear">All caught up</span>
        )
      }
    >
      <div className="ux-notif">
        <div className="ux-notif__toolbar">
          <div className="ux-notif__filters" role="tablist" aria-label="Filter notifications">
            {(["all", "critical", "high"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={
                  "filter-chip" +
                  (filter === f ? ` is-active--${f === "all" ? "all" : f}` : "")
                }
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button
              type="button"
              className="ux-btn ux-btn--sm ux-btn--ghost ux-notif__mark"
              onClick={() => setRead(new Set(all.map((n) => n.id)))}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="ux-notif__panel">
          {list.length === 0 ? (
            <div className="ux-empty ux-notif__empty">
              <div className="ux-empty__icon">◔</div>
              You&apos;re all caught up.
            </div>
          ) : (
            <ul className="ux-notif__list">
              {list.map((n) => {
                const isRead = read.has(n.id);
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className={"ux-notif__row" + (isRead ? " is-read" : "")}
                      onClick={() => setRead((prev) => new Set(prev).add(n.id))}
                    >
                      <span className="ux-notif__gutter" aria-hidden>
                        {!isRead && <span className="ux-notif__dot" />}
                      </span>
                      <div className="ux-notif__main">
                        <div className="ux-notif__head">
                          <span className={`sev-badge ${SEV_CLASS[n.type]}`}>
                            {SEV_LABEL[n.type]}
                          </span>
                          <span className="ux-notif__date">{formatDate(n.date)}</span>
                        </div>
                        <p className="ux-notif__title">{n.title}</p>
                        <p className="ux-notif__body">{n.body}</p>
                      </div>
                      {n.amount != null && (
                        <div className="ux-notif__amount">{fmtMoney(n.amount)}</div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
