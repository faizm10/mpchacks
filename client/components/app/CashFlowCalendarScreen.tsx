"use client";

import { useState, useMemo } from "react";
import AppShell from "./AppShell";
import { Card, Kpi } from "./ui";
import { fmtMoney } from "@/lib/analytics";
import {
  getCashFlowMonth,
  detectRecurringBills,
  getAvailableMonths,
  type DayData,
} from "@/lib/cashflow";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ZONE_BG: Record<DayData["zone"], string> = {
  safe:    "rgba(34,197,94,0.08)",
  caution: "rgba(234,179,8,0.08)",
  high:    "rgba(249,115,22,0.10)",
};
const ZONE_BORDER: Record<DayData["zone"], string> = {
  safe:    "rgba(34,197,94,0.35)",
  caution: "rgba(234,179,8,0.40)",
  high:    "rgba(249,115,22,0.40)",
};
const ZONE_AMOUNT_COLOR: Record<DayData["zone"], string> = {
  safe:    "#16a34a",
  caution: "#a16207",
  high:    "#c2410c",
};
const ZONE_BAR_COLOR: Record<DayData["zone"], string> = {
  safe:    "var(--status-positive)",
  caution: "var(--status-medium)",
  high:    "var(--status-high)",
};

export default function CashFlowCalendarScreen() {
  const available = useMemo(() => getAvailableMonths(), []);
  const [selIdx, setSelIdx] = useState(() => Math.max(0, available.length - 1));

  const sel = available[selIdx] ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    label: "",
  };

  const monthData = useMemo(
    () => getCashFlowMonth(sel.year, sel.month),
    [sel.year, sel.month]
  );

  const bills = useMemo(() => detectRecurringBills().slice(0, 12), []);

  // Pad calendar to start on Sunday
  const firstDow = new Date(sel.year, sel.month - 1, 1).getDay();
  const gridCells: (DayData | null)[] = [
    ...Array(firstDow).fill(null),
    ...monthData.days,
  ];
  while (gridCells.length % 7 !== 0) gridCells.push(null);

  const maxSpend = Math.max(...monthData.days.map(d => d.spend), 1);
  const activeDays = monthData.days.filter(d => d.txCount > 0).length;

  return (
    <AppShell
      kicker="Planning"
      title="Cash Flow Calendar"
      subtitle="Daily spend heat map · recurring bills · safe-to-spend zones"
    >
      {/* KPI strip */}
      <div className="ux-kpis" style={{ marginBottom: 20 }}>
        <Kpi
          label="Month Spend"
          value={fmtMoney(monthData.totalSpend, { compact: true })}
          sub={`${activeDays} active days`}
          accent="var(--status-high)"
        />
        <Kpi
          label="Credits Received"
          value={fmtMoney(monthData.totalIncome, { compact: true })}
          sub="refunds & card credits"
          accent="var(--status-positive)"
        />
        <Kpi
          label="Recurring Bills"
          value={bills.length.toString()}
          sub="detected patterns"
          accent="var(--status-critical)"
        />
        <Kpi
          label="Safe Days"
          value={monthData.safeDayCount.toString()}
          sub="low-commitment days"
          accent="var(--accent)"
        />
      </div>

      <div className="ux-grid ux-grid--2-1" style={{ alignItems: "start" }}>
        {/* ── Calendar card ── */}
        <Card
          title={monthData.label}
          sub={
            monthData.totalSpend > 0
              ? `${fmtMoney(monthData.totalSpend, { compact: true })} total spend`
              : "No transaction data — showing projected bills only"
          }
          action={
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="ux-btn ux-btn--sm"
                onClick={() => setSelIdx(i => Math.max(0, i - 1))}
                disabled={selIdx === 0}
              >
                ‹ Prev
              </button>
              <button
                className="ux-btn ux-btn--sm"
                onClick={() => setSelIdx(i => Math.min(available.length - 1, i + 1))}
                disabled={selIdx === available.length - 1}
              >
                Next ›
              </button>
            </div>
          }
        >
          {/* Day-of-week header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 3,
              marginBottom: 4,
            }}
          >
            {DOW.map(d => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  padding: "2px 0 4px",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {gridCells.map((day, i) =>
              day === null ? (
                <div key={`pad-${i}`} style={{ minHeight: 76 }} />
              ) : (
                <DayCell key={day.date} day={day} maxSpend={maxSpend} />
              )
            )}
          </div>

          {/* Zone legend */}
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid var(--line-soft)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {(["safe", "caution", "high"] as const).map(zone => (
              <div
                key={zone}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    flexShrink: 0,
                    background: ZONE_BG[zone],
                    border: `1.5px solid ${ZONE_BORDER[zone]}`,
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>
                  {zone === "safe" ? "Safe to spend" : zone === "caution" ? "Plan carefully" : "High commitment"}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
              <span style={{ color: "var(--status-critical)", fontWeight: 700 }}>⚑</span>
              Recurring bill
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
              <span style={{ color: "var(--status-positive)", fontWeight: 700 }}>↑</span>
              Credit / income
            </div>
          </div>
        </Card>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Recurring bills list */}
          <Card
            title="Recurring Bills"
            sub={`${bills.length} consistent payment patterns detected`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {bills.length === 0 && (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No recurring patterns found
                </div>
              )}
              {bills.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    borderRadius: 6,
                    background: "var(--fill-1)",
                    border: "1px solid var(--line-soft)",
                  }}
                >
                  {/* Day badge */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 5,
                      flexShrink: 0,
                      background: "var(--status-critical-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "var(--status-critical)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {b.dayOfMonth}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--ink)",
                      }}
                    >
                      {b.merchant}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--muted)" }}>
                      {b.category} · seen {b.occurrences}×
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--mono)",
                      flexShrink: 0,
                      color: "var(--ink)",
                    }}
                  >
                    {fmtMoney(b.avgAmount, { compact: true })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Zone guide */}
          <Card title="Zone Guide" sub="how days are scored">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  zone: "safe" as const,
                  label: "Safe to Spend",
                  desc: "No recurring bills · low historical spend",
                },
                {
                  zone: "caution" as const,
                  label: "Plan Carefully",
                  desc: "Minor bills expected or moderate spend",
                },
                {
                  zone: "high" as const,
                  label: "High Commitment",
                  desc: "Major recurring bill due or peak spend day",
                },
              ].map(({ zone, label, desc }) => (
                <div key={zone} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      flexShrink: 0,
                      marginTop: 2,
                      background: ZONE_BG[zone],
                      border: `1.5px solid ${ZONE_BORDER[zone]}`,
                      display: "inline-block",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// ── Day cell ──────────────────────────────────────────────────────────────────

function DayCell({ day, maxSpend }: { day: DayData; maxSpend: number }) {
  const spendPct = maxSpend > 0 ? (day.spend / maxSpend) * 100 : 0;

  const bg = day.isFuture && day.spend === 0 ? "var(--fill-1)" : ZONE_BG[day.zone];
  const borderStyle = day.isToday
    ? `2px solid var(--accent)`
    : `1px solid ${day.isFuture && day.spend === 0 ? "var(--line-soft)" : ZONE_BORDER[day.zone]}`;

  return (
    <div
      style={{
        border: borderStyle,
        borderRadius: 5,
        background: bg,
        padding: "5px 6px 4px",
        minHeight: 76,
        display: "flex",
        flexDirection: "column",
        opacity: day.isFuture && day.spend === 0 && day.bills.length === 0 ? 0.45 : 1,
        transition: "opacity .15s",
      }}
    >
      {/* Header row: day number + icons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: day.isToday ? 800 : 600,
            color: day.isToday ? "var(--accent)" : "var(--ink)",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {day.day}
        </span>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {day.bills.length > 0 && (
            <span
              title={`Recurring: ${day.bills.map(b => b.merchant).join(", ")}`}
              style={{ fontSize: 9, color: "var(--status-critical)", lineHeight: 1 }}
            >
              ⚑
            </span>
          )}
          {day.income > 0 && (
            <span
              title={`Credit: ${fmtMoney(day.income)}`}
              style={{ fontSize: 9, color: "var(--status-positive)", lineHeight: 1 }}
            >
              ↑
            </span>
          )}
        </div>
      </div>

      {/* Spend amount */}
      <div style={{ flex: 1 }}>
        {day.spend > 0 && (
          <div
            style={{
              fontSize: 10,
              fontFamily: "var(--mono)",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              color: ZONE_AMOUNT_COLOR[day.zone],
              lineHeight: 1.3,
            }}
          >
            {fmtMoney(day.spend, { compact: true })}
          </div>
        )}
        {day.txCount > 0 && (
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 1, lineHeight: 1 }}>
            {day.txCount} tx
          </div>
        )}
        {day.isFuture && day.bills.length > 0 && day.spend === 0 && (
          <div
            style={{
              fontSize: 9,
              color: "var(--status-critical)",
              marginTop: 2,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            ~{fmtMoney(day.bills.reduce((s, b) => s + b.avgAmount, 0), { compact: true })} due
          </div>
        )}
      </div>

      {/* Mini spend bar */}
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: "rgba(0,0,0,0.06)",
          marginTop: 4,
          overflow: "hidden",
        }}
      >
        {spendPct > 0 && (
          <div
            style={{
              height: "100%",
              width: `${spendPct}%`,
              background: ZONE_BAR_COLOR[day.zone],
              borderRadius: 2,
            }}
          />
        )}
      </div>
    </div>
  );
}
