"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { analyzeTransactions, CARD_NAMES, type ComplianceResult, type Transaction } from "@/lib/compliance";
import { type Severity } from "@/lib/policy";
import rawData from "@/lib/transactions.json";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const transactions = rawData as Transaction[];


function statusVar(sev: Severity | string): string {
  return `var(--status-${sev})`;
}

function riskColor(score: number): string {
  if (score >= 80) return "var(--status-critical)";
  if (score >= 50) return "var(--status-high)";
  if (score >= 25) return "var(--status-medium)";
  return "var(--status-positive)";
}

function SeverityBadge({ sev, pulse }: { sev: Severity | null; pulse?: boolean }) {
  if (!sev) return <span className="sev-badge sev-badge--clear">clear</span>;
  return (
    <span className={`sev-badge sev-badge--${sev}`}>
      {pulse && sev === "critical" && <span className="sev-badge__pulse" />}
      {sev}
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  return (
    <div style={styles.riskBarTrack}>
      <div style={{ ...styles.riskBarFill, width: `${score}%`, background: riskColor(score) }} />
    </div>
  );
}

export default function ComplianceEngine() {
  const results = useMemo(() => analyzeTransactions(transactions), []);
  const flagged = useMemo(() => results.filter((r) => r.status !== "clear"), [results]);
  const critical = useMemo(() => results.filter((r) => r.status === "critical"), [results]);

  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ComplianceResult | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const displayResults = useMemo(() => {
    let list = flagged;
    if (filter !== "all") list = list.filter((r) => r.overallSeverity === filter);
    if (cardFilter !== "all") list = list.filter((r) => r.tx.cardCode === cardFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.tx.merchant.toLowerCase().includes(q) ||
          r.tx.city.toLowerCase().includes(q) ||
          r.mccLabel.toLowerCase().includes(q) ||
          r.tx.amount.toString().includes(q)
      );
    }
    return list.sort((a, b) => b.riskScore - a.riskScore);
  }, [flagged, filter, cardFilter, search]);

  const stats = useMemo(() => {
    const totalFlagged = flagged.length;
    const totalAmount = flagged.reduce((s, r) => s + r.tx.amount, 0);
    const critCount = critical.length;
    const highCount = flagged.filter((r) => r.overallSeverity === "high").length;
    const uniqueCards = new Set(flagged.map((r) => r.tx.cardCode)).size;
    return { totalFlagged, totalAmount, critCount, highCount, uniqueCards };
  }, [flagged, critical]);

  const uniqueCards = useMemo(
    () => [...new Set(transactions.map((t) => t.cardCode))].sort(),
    []
  );

  const fetchAiReasoning = useCallback(async (result: ComplianceResult) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setAiLoading(true);
    setAiReasoning(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      setAiReasoning(data.reasoning ?? null);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") setAiReasoning(null);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const selectResult = useCallback(
    (r: ComplianceResult) => {
      setSelected(r);
      fetchAiReasoning(r);
    },
    [fetchAiReasoning]
  );

  return (
    <AppShell
      kicker="Live Feature · ⚑"
      title="Policy Compliance Engine"
      subtitle={
        <>
          {transactions.length.toLocaleString()} transactions scanned ·{" "}
          <span style={{ color: statusVar("critical") }}>{stats.critCount} critical</span> ·{" "}
          <span style={{ color: statusVar("high") }}>{stats.highCount} high</span> ·{" "}
          {stats.totalFlagged} total flagged
        </>
      }
    >
      <div className="compliance">
          <div style={styles.statsRow}>
            <StatCard label="Flagged" value={stats.totalFlagged.toString()} accent="var(--status-high)" />
            <StatCard label="Critical" value={stats.critCount.toString()} accent="var(--status-critical)" />
            <StatCard label="At-Risk Value" value={`$${(stats.totalAmount / 1000).toFixed(0)}k`} accent="var(--status-medium)" />
            <StatCard label="Cards Involved" value={stats.uniqueCards.toString()} accent="var(--accent)" />
          </div>

          <div className="compliance-panel" style={{ marginTop: 24 }}>
            <div className="compliance-panel__body">
              {/* Left: Feed */}
              <div className="compliance-feed">
                {/* Filters */}
                <div style={styles.filterBar}>
                  <Input
                    style={styles.searchInput}
                    placeholder="Search merchant, city, category…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div style={styles.filterChips}>
                    {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
                      <button
                        key={f}
                        className={filter === f ? `filter-chip is-active--${f}` : "filter-chip"}
                        style={styles.chip}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <select
                    style={styles.cardSelect}
                    value={cardFilter}
                    onChange={(e) => setCardFilter(e.target.value)}
                  >
                    <option value="all">All cards</option>
                    {uniqueCards.map((c) => (
                      <option key={c} value={c}>
                        {CARD_NAMES[c] ?? c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.feedCount}>
                  {displayResults.length} violations · sorted by risk score
                </div>

                {/* Violation Feed */}
                <div style={styles.feed}>
                  {displayResults.slice(0, 200).map((r) => (
                    <ViolationCard
                      key={r.tx.id}
                      result={r}
                      isSelected={selected?.tx.id === r.tx.id}
                      onClick={() => selectResult(r)}
                    />
                  ))}
                  {displayResults.length === 0 && (
                    <div style={styles.emptyFeed}>No violations match the current filters.</div>
                  )}
                </div>
              </div>

              {/* Right: Detail Panel */}
              <div className="compliance-detail">
                {selected ? (
                  <DetailPanel
                    result={selected}
                    aiReasoning={aiReasoning}
                    aiLoading={aiLoading}
                  />
                ) : (
                  <div style={styles.emptyDetail}>
                    <div style={styles.emptyDetailIcon}>⚑</div>
                    <div style={styles.emptyDetailText}>Select a violation to investigate</div>
                    <div style={styles.emptyDetailSub}>
                      AI context, linked transactions, and recommended actions appear here.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ViolationCard({
  result,
  isSelected,
  onClick,
}: {
  result: ComplianceResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sev = result.overallSeverity;
  const accent = sev ? statusVar(sev) : statusVar("low");
  return (
    <button
      className={isSelected ? "violation-card is-selected" : "violation-card"}
      style={{
        ...styles.violationCard,
        borderLeftColor: accent,
        background: isSelected ? undefined : styles.violationCard.background,
        outline: isSelected ? undefined : "none",
      }}
      onClick={onClick}
    >
      <div style={styles.vcTop}>
        <div style={styles.vcMerchant}>{result.tx.merchant}</div>
        <div style={{ ...styles.vcAmount, color: accent }}>
          ${result.tx.amount.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div style={styles.vcMeta}>
        <span style={styles.vcMetaItem}>{result.mccLabel}</span>
        <span style={styles.vcMetaDot}>·</span>
        <span style={styles.vcMetaItem}>{result.tx.city}{result.tx.state ? `, ${result.tx.state}` : ""}</span>
        <span style={styles.vcMetaDot}>·</span>
        <span style={styles.vcMetaItem}>{result.tx.txDate}</span>
      </div>
      <div style={styles.vcFooter}>
        <SeverityBadge sev={sev} pulse={sev === "critical"} />
        <div style={styles.vcViolations}>
          {result.violations.slice(0, 2).map((v) => (
            <span key={v.ruleId} style={styles.vcViolChip}>
              {v.ruleTitle}
            </span>
          ))}
          {result.violations.length > 2 && (
            <span style={styles.vcViolChip}>+{result.violations.length - 2} more</span>
          )}
        </div>
        <div style={styles.vcRisk}>
          <RiskBar score={result.riskScore} />
          <span style={styles.vcRiskNum}>{result.riskScore}</span>
        </div>
      </div>
    </button>
  );
}

function DetailPanel({
  result,
  aiReasoning,
  aiLoading,
}: {
  result: ComplianceResult;
  aiReasoning: string | null;
  aiLoading: boolean;
}) {
  const { tx, violations, mccLabel, riskScore: score } = result;
  const sev = result.overallSeverity;
  const accent = sev ? statusVar(sev) : statusVar("low");

  return (
    <div style={styles.detail}>
      {/* Detail header */}
      <div style={{ ...styles.detailHeader, borderLeftColor: accent }}>
        <div style={styles.detailMerchant}>{tx.merchant}</div>
        <div style={{ ...styles.detailAmount, color: accent }}>
          ${tx.amount.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={styles.detailMeta}>
          <SeverityBadge sev={sev} pulse />
          <span style={styles.detailMetaItem}>{mccLabel}</span>
          <span style={styles.detailMetaItem}>Card {CARD_NAMES[tx.cardCode] ?? tx.cardCode}</span>
        </div>
      </div>

      {/* Risk score */}
      <div style={styles.riskSection}>
        <div style={styles.riskLabel}>Risk Score</div>
        <div style={styles.riskRow}>
          <div style={styles.riskBarTrackWide}>
            <div
              style={{
                ...styles.riskBarFillWide,
                width: `${score}%`,
                background: riskColor(score),
              }}
            />
          </div>
          <span style={{ ...styles.riskNumLarge, color: riskColor(score) }}>
            {score}
          </span>
        </div>
      </div>

      {/* Transaction details */}
      <div style={styles.txGrid}>
        <TxField label="Date" value={tx.txDate} />
        <TxField label="Post Date" value={tx.postDate} />
        <TxField label="Location" value={`${tx.city}${tx.state ? `, ${tx.state}` : ""} · ${tx.country}`} />
        <TxField label="Card Code" value={tx.cardCode} />
        <TxField label="Type" value={tx.type} />
        <TxField label="MCC" value={`${tx.mcc} · ${mccLabel}`} />
      </div>

      {/* Violations */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          Detected Violations
          <span style={styles.sectionCount}>{violations.length}</span>
        </div>
        <div style={styles.violationList}>
          {violations.map((v) => (
            <div
              key={v.ruleId}
              style={{ ...styles.violationItem, borderLeftColor: statusVar(v.severity) }}
            >
              <div style={styles.viHeader}>
                <span style={{ ...styles.viTitle, color: statusVar(v.severity) }}>{v.ruleTitle}</span>
                <span style={styles.viConf}>{Math.round(v.confidence * 100)}% confidence</span>
              </div>
              <div style={styles.viReason}>{v.reason}</div>
              <div style={styles.viRec}>→ {v.recommendation}</div>
              {v.linkedTxIds && v.linkedTxIds.length > 0 && (
                <div style={styles.viLinked}>
                  ⬡ Linked transactions: {v.linkedTxIds.slice(0, 3).join(", ")}
                  {v.linkedTxIds.length > 3 ? ` +${v.linkedTxIds.length - 3} more` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Context */}
      <div style={styles.aiSection}>
        <div style={styles.aiHeader}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span style={{ ...styles.aiIcon, cursor: "help" }}>✦</span>
            </TooltipTrigger>
            <TooltipContent>Generated by Claude from policy + transaction context</TooltipContent>
          </Tooltip>
          <span style={styles.aiLabel}>AI Context</span>
          {aiLoading && <span style={styles.aiSpinner}>analyzing…</span>}
        </div>
        <div style={styles.aiBody}>
          {aiLoading ? (
            <div style={styles.aiSkeleton}>
              <div style={{ ...styles.aiSkeletonLine, width: "95%" }} />
              <div style={{ ...styles.aiSkeletonLine, width: "80%" }} />
              <div style={{ ...styles.aiSkeletonLine, width: "60%" }} />
            </div>
          ) : aiReasoning ? (
            <p style={styles.aiText}>{aiReasoning}</p>
          ) : (
            <p style={{ ...styles.aiText, color: "var(--shell-text-muted)" }}>
              AI reasoning unavailable — check ANTHROPIC_API_KEY.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <Button className="action-btn action-btn--dismiss" style={styles.btnDismiss}>Dismiss</Button>
        <Button className="action-btn action-btn--escalate" style={styles.btnEscalate}>Escalate to Manager</Button>
        <Button
          className="action-btn action-btn--flag"
          style={{ ...styles.btnFlag, background: sev === "critical" ? statusVar("critical") : statusVar("high") }}
        >
          Flag for Review
        </Button>
      </div>
    </div>
  );
}

function TxField({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.txField}>
      <div style={styles.txFieldLabel}>{label}</div>
      <div style={styles.txFieldValue}>{value}</div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  statsRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
  },
  statCard: {
    background: "var(--fill-0)",
    border: "1px solid var(--shell-border)",
    borderRadius: 8,
    padding: "10px 16px",
    minWidth: 90,
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: {
    fontSize: 10,
    color: "var(--shell-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginTop: 2,
  },
  filterBar: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--shell-border-soft)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  searchInput: {
    width: "100%",
    background: "var(--shell-input-bg)",
    border: "1px solid var(--shell-border)",
    borderRadius: 6,
    padding: "7px 12px",
    color: "var(--shell-text-primary)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  filterChips: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap" as const,
  },
  chip: {
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid var(--shell-border)",
    background: "transparent",
    color: "var(--shell-text-secondary)",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.15s",
    textTransform: "capitalize" as const,
  },
  cardSelect: {
    background: "var(--shell-input-bg)",
    border: "1px solid var(--shell-border)",
    borderRadius: 6,
    padding: "5px 8px",
    color: "var(--shell-text-secondary)",
    fontSize: 12,
    outline: "none",
    width: "100%",
  },
  feedCount: {
    padding: "6px 16px",
    fontSize: 11,
    color: "var(--shell-text-muted)",
    borderBottom: "1px solid var(--shell-border-soft)",
  },
  feed: {
    overflowY: "auto" as const,
    flex: 1,
    padding: "8px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  emptyFeed: {
    textAlign: "center" as const,
    color: "var(--shell-text-faint)",
    fontSize: 13,
    padding: "40px 20px",
  },
  violationCard: {
    width: "100%",
    background: "var(--fill-0)",
    borderTop: "1px solid var(--shell-border-soft)",
    borderRight: "1px solid var(--shell-border-soft)",
    borderBottom: "1px solid var(--shell-border-soft)",
    borderLeftWidth: 3,
    borderLeftStyle: "solid" as const,
    borderRadius: 8,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "all 0.15s",
  },
  vcTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  vcMerchant: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--shell-text-primary)",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  vcAmount: {
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
  },
  vcMeta: {
    display: "flex",
    gap: 4,
    marginTop: 3,
    flexWrap: "wrap" as const,
  },
  vcMetaItem: {
    fontSize: 10,
    color: "var(--shell-text-muted)",
  },
  vcMetaDot: {
    fontSize: 10,
    color: "var(--shell-text-faint)",
  },
  vcFooter: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    flexWrap: "wrap" as const,
  },
  vcViolations: {
    display: "flex",
    gap: 4,
    flex: 1,
    flexWrap: "wrap" as const,
  },
  vcViolChip: {
    fontSize: 9,
    fontWeight: 500,
    color: "var(--shell-text-secondary)",
    background: "var(--shell-chip-bg)",
    borderRadius: 5,
    padding: "2px 6px",
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--shell-text-faint) 30%, transparent)",
  },
  vcRisk: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  vcRiskNum: {
    fontSize: 10,
    color: "var(--shell-text-muted)",
    fontVariantNumeric: "tabular-nums",
    width: 20,
    textAlign: "right" as const,
  },
  riskBarTrack: {
    width: 48,
    height: 4,
    background: "var(--shell-track-bg)",
    borderRadius: 3,
    overflow: "hidden",
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--shell-text-faint) 18%, transparent)",
  },
  riskBarFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s ease",
    boxShadow: "inset 0 -1px 1px rgba(0, 0, 0, 0.12)",
  },
  emptyDetail: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "var(--shell-text-faint)",
    padding: 40,
  },
  emptyDetailIcon: {
    fontSize: 48,
    color: "var(--shell-text-ghost)",
  },
  emptyDetailText: {
    fontSize: 16,
    fontWeight: 500,
    color: "var(--shell-text-muted)",
  },
  emptyDetailSub: {
    fontSize: 13,
    color: "var(--shell-text-faint)",
    textAlign: "center" as const,
    maxWidth: 300,
  },
  detail: {
    padding: 24,
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  detailHeader: {
    borderLeftWidth: 4,
    borderLeftStyle: "solid" as const,
    paddingLeft: 16,
  },
  detailMerchant: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--shell-text-primary)",
    lineHeight: 1.2,
  },
  detailAmount: {
    fontSize: 32,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.2,
    marginTop: 4,
  },
  detailMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    flexWrap: "wrap" as const,
  },
  detailMetaItem: {
    fontSize: 12,
    color: "var(--shell-text-muted)",
  },
  riskSection: {
    background: "var(--fill-1)",
    border: "1px solid var(--shell-border-soft)",
    borderRadius: 10,
    padding: "12px 16px",
    boxShadow: "var(--shadow-card)",
  },
  riskLabel: {
    fontSize: 10,
    color: "var(--shell-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  riskRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  riskBarTrackWide: {
    flex: 1,
    height: 7,
    background: "var(--shell-track-bg)",
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--shell-text-faint) 16%, transparent)",
  },
  riskBarFillWide: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.4s ease",
    boxShadow: "inset 0 -1px 1px rgba(0, 0, 0, 0.14)",
  },
  riskNumLarge: {
    fontSize: 20,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    width: 36,
    textAlign: "right" as const,
  },
  txGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  txField: {
    background: "var(--fill-1)",
    borderRadius: 8,
    padding: "9px 13px",
    boxShadow: "inset 0 0 0 1px var(--shell-border-soft)",
  },
  txFieldLabel: {
    fontSize: 10,
    color: "var(--shell-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 3,
  },
  txFieldValue: {
    fontSize: 13,
    color: "var(--shell-text-secondary)",
    fontVariantNumeric: "tabular-nums",
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: "var(--shell-text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sectionCount: {
    background: "var(--shell-chip-bg)",
    borderRadius: 10,
    padding: "1px 6px",
    fontSize: 10,
  },
  violationList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  violationItem: {
    background: "var(--fill-0)",
    borderTop: "1px solid var(--shell-border-soft)",
    borderRight: "1px solid var(--shell-border-soft)",
    borderBottom: "1px solid var(--shell-border-soft)",
    borderLeftWidth: 3,
    borderLeftStyle: "solid" as const,
    borderRadius: 8,
    padding: "11px 14px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  viHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  viTitle: {
    fontSize: 13,
    fontWeight: 600,
  },
  viConf: {
    fontSize: 10,
    color: "var(--shell-text-muted)",
  },
  viReason: {
    fontSize: 12,
    color: "var(--shell-text-secondary)",
    lineHeight: 1.4,
  },
  viRec: {
    fontSize: 11,
    color: "var(--shell-text-muted)",
    marginTop: 4,
    fontStyle: "italic",
  },
  viLinked: {
    fontSize: 10,
    color: "var(--accent-soft)",
    marginTop: 4,
    background: "var(--shell-accent-surface)",
    borderRadius: 4,
    padding: "2px 6px",
    display: "inline-block",
  },
  aiSection: {
    background: "var(--shell-accent-surface)",
    border: "1px solid var(--shell-accent-border)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "var(--shadow-card)",
  },
  aiHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid var(--shell-accent-border-soft)",
  },
  aiIcon: {
    color: "var(--accent-soft)",
    fontSize: 14,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--accent-soft)",
    flex: 1,
  },
  aiSpinner: {
    fontSize: 11,
    color: "var(--accent-soft)",
    animation: "pulse 1s infinite",
  },
  aiBody: {
    padding: "12px 16px",
    minHeight: 60,
  },
  aiText: {
    fontSize: 13,
    color: "var(--shell-text-secondary)",
    lineHeight: 1.6,
    margin: 0,
  },
  aiSkeleton: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  aiSkeletonLine: {
    height: 12,
    background: "var(--shell-chip-bg)",
    borderRadius: 4,
    animation: "pulse 1.2s ease-in-out infinite",
  },
  actions: {
    display: "flex",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  btnDismiss: {
    flex: 1,
    padding: "9px 12px",
    background: "var(--fill-0)",
    border: "1px solid var(--shell-border)",
    borderRadius: 8,
    color: "var(--shell-text-secondary)",
    fontSize: 13,
    cursor: "pointer",
  },
  btnEscalate: {
    flex: 1,
    padding: "9px 12px",
    background: "var(--shell-accent-surface)",
    border: "1px solid var(--shell-accent-border)",
    borderRadius: 8,
    color: "var(--accent-ink)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnFlag: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    color: "var(--on-accent)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px -5px rgba(0, 0, 0, 0.4)",
  },
};
