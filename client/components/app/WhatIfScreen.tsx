"use client";

import { useState, useMemo, useCallback } from "react";
import AppShell from "./AppShell";
import { Card, Kpi } from "./ui";
import { fmtMoney } from "@/lib/analytics";
import {
  PRESET_SCENARIOS,
  computeBaseline,
  projectScenarios,
  computeSummary,
  type Scenario,
  type ProjectionPoint,
} from "@/lib/whatif";

// ── Projection chart (dual-line SVG) ─────────────────────────────────────────

function ProjectionChart({ points }: { points: ProjectionPoint[] }) {
  if (!points.length) return null;

  const W = 600;
  const H = 200;
  const pad = { l: 64, r: 12, t: 16, b: 32 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const allValues = points.flatMap(p => [p.baseline, p.projected]);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const spread = dataMax - dataMin || dataMax * 0.1 || 1;
  const yMin = Math.max(0, dataMin - spread * 0.08);
  const yMax = dataMax + spread * 0.08;
  const yRange = yMax - yMin;

  const xOf = (i: number) => pad.l + (i / Math.max(points.length - 1, 1)) * iW;
  const yOf = (v: number) => pad.t + iH - ((v - yMin) / yRange) * iH;

  const baselinePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(p.baseline)}`)
    .join(" ");

  const projectedPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(p.projected)}`)
    .join(" ");

  // Area between lines — green if net savings, orange if net cost
  const lastDelta = points[points.length - 1].projected - points[points.length - 1].baseline;
  const areaColor = lastDelta <= 0 ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.10)";
  const lineColor = lastDelta <= 0 ? "#16a34a" : "#ea580c";

  const areaPath =
    projectedPath +
    ` L${xOf(points.length - 1)},${yOf(points[points.length - 1].baseline)}` +
    points
      .slice()
      .reverse()
      .map((p, i) => `L${xOf(points.length - 1 - i)},${yOf(p.baseline)}`)
      .join(" ") +
    " Z";

  // Y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    yMin + (yRange / (yTicks - 1)) * i
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 200, display: "block" }}
    >
      {/* Y gridlines + labels */}
      {yTickValues.map((v, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            y1={yOf(v)}
            x2={W - pad.r}
            y2={yOf(v)}
            stroke="var(--line-soft)"
            strokeWidth="0.6"
            strokeDasharray="3 3"
          />
          <text
            x={pad.l - 5}
            y={yOf(v) + 3.5}
            fontSize="8"
            fill="var(--muted)"
            textAnchor="end"
            fontFamily="var(--mono)"
          >
            {v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${Math.round(v)}`}
          </text>
        </g>
      ))}

      {/* Shaded area between lines */}
      <path d={areaPath} fill={areaColor} />

      {/* Baseline — dashed gray */}
      <path
        d={baselinePath}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.5"
        strokeDasharray="5 3"
        strokeLinecap="round"
      />

      {/* Projected line */}
      <path
        d={projectedPath}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Projected dots */}
      {points.map((p, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(p.projected)} r="2.5" fill={lineColor} />
      ))}

      {/* X labels — every other month to avoid crowding */}
      {points.map((p, i) =>
        i % 2 === 0 || i === points.length - 1 ? (
          <text
            key={i}
            x={xOf(i)}
            y={H - 6}
            fontSize="8"
            fill="var(--muted)"
            textAnchor="middle"
            fontFamily="var(--mono)"
          >
            {p.label}
          </text>
        ) : null
      )}

      {/* Legend inside chart */}
      <g>
        <line x1={W - 110} y1={pad.t + 6} x2={W - 96} y2={pad.t + 6} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 2" />
        <text x={W - 93} y={pad.t + 9} fontSize="8" fill="var(--muted)" fontFamily="var(--mono)">Baseline</text>
        <line x1={W - 110} y1={pad.t + 18} x2={W - 96} y2={pad.t + 18} stroke={lineColor} strokeWidth="2" />
        <text x={W - 93} y={pad.t + 21} fontSize="8" fill="var(--muted)" fontFamily="var(--mono)">Projected</text>
      </g>
    </svg>
  );
}

// ── Scenario card ─────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  enabled,
  onToggle,
  onUpdate,
}: {
  scenario: Scenario;
  enabled: boolean;
  onToggle: () => void;
  onUpdate: (params: Scenario["params"]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = scenario.params;

  const monthlyLabel =
    p.monthlyDelta === 0
      ? "No recurring change"
      : p.monthlyDelta > 0
      ? `+${fmtMoney(p.monthlyDelta, { compact: true })}/mo`
      : `${fmtMoney(p.monthlyDelta, { compact: true })}/mo`;
  const monthlyColor = p.monthlyDelta > 0 ? "var(--status-high)" : p.monthlyDelta < 0 ? "var(--status-positive)" : "var(--muted)";

  return (
    <div
      style={{
        border: `1.5px solid ${enabled ? scenario.color + "55" : "var(--line-soft)"}`,
        borderRadius: 8,
        background: enabled ? scenario.color + "08" : "var(--fill-0)",
        transition: "border-color .15s, background .15s",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Icon */}
          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{scenario.icon}</span>

          {/* Label + description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 2,
                lineHeight: 1.3,
              }}
            >
              {scenario.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                lineHeight: 1.4,
              }}
            >
              {scenario.description}
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={onToggle}
            style={{
              flexShrink: 0,
              width: 36,
              height: 20,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: enabled ? scenario.color : "var(--fill-2)",
              position: "relative",
              transition: "background .2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: enabled ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#fff",
                transition: "left .2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>

        {/* Impact badges */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {p.oneTimeCost > 0 && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--mono)",
                background: "var(--status-critical-bg)",
                color: "var(--status-critical)",
                padding: "2px 7px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {fmtMoney(p.oneTimeCost, { compact: true })} upfront
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              background: p.monthlyDelta > 0 ? "var(--status-high-bg)" : p.monthlyDelta < 0 ? "var(--status-positive-bg)" : "var(--fill-1)",
              color: monthlyColor,
              padding: "2px 7px",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {monthlyLabel}
          </span>
          {p.startMonthOffset > 0 && (
            <span
              style={{
                fontSize: 10,
                color: "var(--muted)",
                background: "var(--fill-1)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              starts month {p.startMonthOffset}
            </span>
          )}
        </div>

        {/* Edit toggle */}
        <button
          className="ux-btn ux-btn--sm ux-btn--ghost"
          onClick={() => setExpanded(x => !x)}
          style={{ marginTop: 8, fontSize: 11 }}
        >
          {expanded ? "▲ Close" : "▼ Edit parameters"}
        </button>
      </div>

      {/* Editable params panel */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--line-soft)",
            padding: "12px 14px",
            background: "var(--fill-1)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 16px",
          }}
        >
          <ParamField
            label="One-time cost ($)"
            value={p.oneTimeCost}
            min={0}
            onChange={v => onUpdate({ ...p, oneTimeCost: v })}
          />
          <ParamField
            label="Monthly change ($)"
            value={p.monthlyDelta}
            hint="negative = savings"
            onChange={v => onUpdate({ ...p, monthlyDelta: v })}
          />
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
              Start (months from now)
            </div>
            <select
              value={p.startMonthOffset}
              onChange={e => onUpdate({ ...p, startMonthOffset: Number(e.target.value) })}
              style={{
                width: "100%",
                fontSize: 12,
                padding: "5px 8px",
                borderRadius: 5,
                border: "1px solid var(--line)",
                background: "var(--fill-0)",
                color: "var(--ink)",
              }}
            >
              <option value={0}>Immediately</option>
              <option value={1}>1 month</option>
              <option value={2}>2 months</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
              Duration
            </div>
            <select
              value={p.durationMonths}
              onChange={e => onUpdate({ ...p, durationMonths: Number(e.target.value) })}
              style={{
                width: "100%",
                fontSize: 12,
                padding: "5px 8px",
                borderRadius: 5,
                border: "1px solid var(--line)",
                background: "var(--fill-0)",
                color: "var(--ink)",
              }}
            >
              <option value={0}>Ongoing</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function ParamField({
  label,
  value,
  hint,
  min,
  onChange,
}: {
  label: string;
  value: number;
  hint?: string;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
        {label}
        {hint && (
          <span style={{ marginLeft: 4, opacity: 0.7 }}>({hint})</span>
        )}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        step={500}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          fontSize: 12,
          padding: "5px 8px",
          borderRadius: 5,
          border: "1px solid var(--line)",
          background: "var(--fill-0)",
          color: "var(--ink)",
          fontFamily: "var(--mono)",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WhatIfScreen() {
  const baseline = useMemo(() => computeBaseline(), []);

  const [scenarios, setScenarios] = useState<Scenario[]>(
    PRESET_SCENARIOS.map(s => ({ ...s, params: { ...s.params } }))
  );
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());

  const points = useMemo(
    () => projectScenarios(scenarios, enabledIds, 12),
    [scenarios, enabledIds]
  );

  const summary = useMemo(
    () => computeSummary(scenarios, enabledIds),
    [scenarios, enabledIds]
  );

  const toggleScenario = useCallback((id: string) => {
    setEnabledIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const updateScenario = useCallback((id: string, params: Scenario["params"]) => {
    setScenarios(prev => prev.map(s => (s.id === id ? { ...s, params } : s)));
  }, []);

  const resetAll = () => {
    setScenarios(PRESET_SCENARIOS.map(s => ({ ...s, params: { ...s.params } })));
    setEnabledIds(new Set());
  };

  const projectedAvgMonthly =
    points.length ? points.reduce((s, p) => s + p.projected, 0) / points.length : baseline;

  const netDelta = projectedAvgMonthly - baseline;
  const netDeltaLabel =
    netDelta === 0
      ? "No change"
      : `${netDelta > 0 ? "+" : ""}${fmtMoney(netDelta, { compact: true })}/mo`;

  return (
    <AppShell
      kicker="Planning"
      title="What-If Sandbox"
      subtitle="Model major expense changes and see the 12-month projected impact on company spend"
      actions={
        <button className="ux-btn ux-btn--sm" onClick={resetAll}>
          ↺ Reset all
        </button>
      }
    >
      {/* KPI strip */}
      <div className="ux-kpis" style={{ marginBottom: 20 }}>
        <Kpi
          label="Baseline (avg/mo)"
          value={fmtMoney(baseline, { compact: true })}
          sub="last 6 months actual"
          accent="var(--accent)"
        />
        <Kpi
          label="Projected (avg/mo)"
          value={fmtMoney(projectedAvgMonthly, { compact: true })}
          sub="with active scenarios"
          accent={netDelta > 0 ? "var(--status-high)" : netDelta < 0 ? "var(--status-positive)" : "var(--muted)"}
        />
        <Kpi
          label="Monthly Impact"
          value={enabledIds.size === 0 ? "—" : netDeltaLabel}
          sub={enabledIds.size === 0 ? "no scenarios active" : netDelta > 0 ? "additional spend" : "savings"}
          accent={netDelta > 0 ? "var(--status-critical)" : "var(--status-positive)"}
        />
        <Kpi
          label="12-Month Net Impact"
          value={enabledIds.size === 0 ? "—" : `${summary.netAnnualImpact > 0 ? "+" : ""}${fmtMoney(summary.netAnnualImpact, { compact: true })}`}
          sub={
            summary.breakEvenMonths !== null
              ? `break-even at month ${summary.breakEvenMonths}`
              : enabledIds.size === 0
              ? "toggle scenarios below"
              : "cumulative"
          }
          accent={summary.netAnnualImpact > 0 ? "var(--status-high)" : summary.netAnnualImpact < 0 ? "var(--status-positive)" : "var(--muted)"}
        />
      </div>

      {/* Projection chart + impact panel */}
      <div className="ux-grid ux-grid--2-1" style={{ marginBottom: 20, alignItems: "start" }}>
        <Card
          title="12-Month Spend Projection"
          sub={
            enabledIds.size === 0
              ? "Toggle scenarios below to see projected impact"
              : `${enabledIds.size} scenario${enabledIds.size !== 1 ? "s" : ""} active`
          }
        >
          <ProjectionChart points={points} />
        </Card>

        <Card title="Impact Breakdown" sub="active scenarios only">
          {enabledIds.size === 0 ? (
            <div
              style={{
                color: "var(--muted)",
                fontSize: 13,
                textAlign: "center",
                padding: "28px 0",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>◎</div>
              Enable scenarios below
              <br />
              to see impact
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Per-scenario breakdown */}
              {scenarios
                .filter(s => enabledIds.has(s.id))
                .map(s => {
                  const monthlyStr =
                    s.params.monthlyDelta === 0
                      ? null
                      : `${s.params.monthlyDelta > 0 ? "+" : ""}${fmtMoney(s.params.monthlyDelta, { compact: true })}/mo`;
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "var(--fill-1)",
                        border: `1px solid ${s.color}33`,
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.label}
                        </div>
                        {s.params.startMonthOffset > 0 && (
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>
                            starts month {s.params.startMonthOffset}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {s.params.oneTimeCost > 0 && (
                          <div style={{ fontSize: 10, color: "var(--status-critical)", fontFamily: "var(--mono)" }}>
                            {fmtMoney(s.params.oneTimeCost, { compact: true })} upfront
                          </div>
                        )}
                        {monthlyStr && (
                          <div
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--mono)",
                              fontWeight: 700,
                              color: s.params.monthlyDelta > 0 ? "var(--status-high)" : "var(--status-positive)",
                            }}
                          >
                            {monthlyStr}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Totals */}
              <div
                style={{
                  borderTop: "1px solid var(--line-soft)",
                  paddingTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                {summary.totalOneTimeCost > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted)" }}>Total upfront</span>
                    <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--status-critical)" }}>
                      {fmtMoney(summary.totalOneTimeCost, { compact: true })}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--muted)" }}>Avg monthly change</span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      color: summary.totalMonthlyDelta > 0 ? "var(--status-high)" : "var(--status-positive)",
                    }}
                  >
                    {summary.totalMonthlyDelta > 0 ? "+" : ""}
                    {fmtMoney(summary.totalMonthlyDelta, { compact: true })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                  <span>12-month total</span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      color: summary.netAnnualImpact > 0 ? "var(--status-high)" : "var(--status-positive)",
                    }}
                  >
                    {summary.netAnnualImpact > 0 ? "+" : ""}
                    {fmtMoney(summary.netAnnualImpact, { compact: true })}
                  </span>
                </div>
                {summary.breakEvenMonths !== null && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--status-positive)",
                      background: "var(--status-positive-bg)",
                      padding: "5px 8px",
                      borderRadius: 5,
                      marginTop: 4,
                    }}
                  >
                    ✓ Upfront cost recovered in ~{summary.breakEvenMonths} months
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Scenario cards grid */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Scenarios</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          Toggle scenarios on to model their impact. Expand any card to edit the parameters.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {scenarios.map(s => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            enabled={enabledIds.has(s.id)}
            onToggle={() => toggleScenario(s.id)}
            onUpdate={params => updateScenario(s.id, params)}
          />
        ))}
      </div>
    </AppShell>
  );
}
