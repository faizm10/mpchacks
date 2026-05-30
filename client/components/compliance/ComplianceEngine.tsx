"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { analyzeTransactions, CARD_NAMES, type ComplianceResult, type Transaction } from "@/lib/compliance";
import { type Severity } from "@/lib/policy";
import rawData from "@/lib/transactions.json";

const transactions = rawData as Transaction[];

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#6b7280",
};
const SEV_BG: Record<string, string> = {
  critical: "rgba(239,68,68,0.12)",
  high: "rgba(249,115,22,0.10)",
  medium: "rgba(234,179,8,0.10)",
  low: "rgba(107,114,128,0.08)",
};

function SeverityBadge({ sev, pulse }: { sev: Severity | null; pulse?: boolean }) {
  if (!sev) return <span style={styles.badgeClear}>clear</span>;
  return (
    <span style={{ ...styles.badge, color: SEV_COLOR[sev], background: SEV_BG[sev], position: "relative" }}>
      {pulse && sev === "critical" && <span style={styles.pulse} />}
      {sev}
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 25 ? "#eab308" : "#22c55e";
  return (
    <div style={styles.riskBarTrack}>
      <div style={{ ...styles.riskBarFill, width: `${score}%`, background: color }} />
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
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="/" style={styles.backLink}>← Wireframe</a>
          <div>
            <div style={styles.headerTitle}>
              <span style={styles.brimMark}>brim</span>
              <span style={styles.headerDivider}>/</span>
              Policy Compliance Engine
            </div>
            <div style={styles.headerSub}>
              {transactions.length.toLocaleString()} transactions scanned ·{" "}
              <span style={{ color: SEV_COLOR.critical }}>{stats.critCount} critical</span> ·{" "}
              <span style={{ color: SEV_COLOR.high }}>{stats.highCount} high</span> ·{" "}
              {stats.totalFlagged} total flagged
            </div>
          </div>
        </div>
        <div style={styles.statsRow}>
          <StatCard label="Flagged" value={stats.totalFlagged.toString()} accent="#f97316" />
          <StatCard label="Critical" value={stats.critCount.toString()} accent="#ef4444" />
          <StatCard label="At-Risk Value" value={`$${(stats.totalAmount / 1000).toFixed(0)}k`} accent="#eab308" />
          <StatCard label="Cards Involved" value={stats.uniqueCards.toString()} accent="#6366f1" />
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Left: Feed */}
        <div style={styles.feedCol}>
          {/* Filters */}
          <div style={styles.filterBar}>
            <input
              style={styles.searchInput}
              placeholder="Search merchant, city, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={styles.filterChips}>
              {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
                <button
                  key={f}
                  style={{
                    ...styles.chip,
                    ...(filter === f ? { background: f === "all" ? "#3b82f6" : SEV_COLOR[f], color: "#fff", borderColor: "transparent" } : {}),
                  }}
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
        <div style={styles.detailCol}>
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
  const accent = sev ? SEV_COLOR[sev] : "#6b7280";
  return (
    <button
      style={{
        ...styles.violationCard,
        borderLeftColor: accent,
        background: isSelected ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.03)",
        outline: isSelected ? `1px solid rgba(59,130,246,0.3)` : "none",
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
  const { tx, violations, mccLabel, riskScore: score, status } = result;
  const sev = result.overallSeverity;
  const accent = sev ? SEV_COLOR[sev] : "#6b7280";

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
                background: score >= 80 ? SEV_COLOR.critical : score >= 50 ? SEV_COLOR.high : score >= 25 ? SEV_COLOR.medium : "#22c55e",
              }}
            />
          </div>
          <span style={{ ...styles.riskNumLarge, color: score >= 80 ? SEV_COLOR.critical : score >= 50 ? SEV_COLOR.high : "#eab308" }}>
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
              style={{ ...styles.violationItem, borderLeftColor: SEV_COLOR[v.severity] ?? "#6b7280" }}
            >
              <div style={styles.viHeader}>
                <span style={{ ...styles.viTitle, color: SEV_COLOR[v.severity] }}>{v.ruleTitle}</span>
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
          <span style={styles.aiIcon}>✦</span>
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
            <p style={{ ...styles.aiText, color: "rgba(255,255,255,0.3)" }}>
              AI reasoning unavailable — check ANTHROPIC_API_KEY.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button style={styles.btnDismiss}>Dismiss</button>
        <button style={styles.btnEscalate}>Escalate to Manager</button>
        <button style={{ ...styles.btnFlag, background: sev === "critical" ? SEV_COLOR.critical : SEV_COLOR.high }}>
          Flag for Review
        </button>
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
  root: {
    minHeight: "100vh",
    background: "#0d0f14",
    color: "#e2e8f0",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    flexWrap: "wrap" as const,
  },
  headerLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
  },
  backLink: {
    color: "rgba(255,255,255,0.35)",
    textDecoration: "none",
    fontSize: 12,
    marginTop: 4,
    whiteSpace: "nowrap" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  brimMark: {
    color: "#2f5fd0",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  headerDivider: {
    color: "rgba(255,255,255,0.2)",
    fontWeight: 300,
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
  },
  statsRow: {
    display: "flex",
    gap: 4,
  },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
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
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginTop: 2,
  },
  body: {
    display: "flex",
    flex: 1,
    minHeight: 0,
    height: "calc(100vh - 81px)",
  },
  feedCol: {
    width: 420,
    flexShrink: 0,
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  filterBar: {
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  searchInput: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "7px 12px",
    color: "#e2e8f0",
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
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.15s",
    textTransform: "capitalize" as const,
  },
  cardSelect: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    padding: "5px 8px",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    outline: "none",
    width: "100%",
  },
  feedCount: {
    padding: "6px 16px",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
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
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    padding: "40px 20px",
  },
  violationCard: {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderLeft: "3px solid",
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
    color: "#f1f5f9",
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
    color: "rgba(255,255,255,0.35)",
  },
  vcMetaDot: {
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
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
    color: "rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    padding: "2px 5px",
  },
  vcRisk: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  vcRiskNum: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontVariantNumeric: "tabular-nums",
    width: 20,
    textAlign: "right" as const,
  },
  riskBarTrack: {
    width: 48,
    height: 3,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  riskBarFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s",
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  badgeClear: {
    fontSize: 10,
    fontWeight: 500,
    padding: "2px 7px",
    borderRadius: 4,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#22c55e",
    background: "rgba(34,197,94,0.1)",
  },
  pulse: {
    position: "absolute" as const,
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#ef4444",
    animation: "pulse 1.5s infinite",
  },
  // Detail panel
  detailCol: {
    flex: 1,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
  },
  emptyDetail: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "rgba(255,255,255,0.2)",
    padding: 40,
  },
  emptyDetailIcon: {
    fontSize: 48,
    color: "rgba(255,255,255,0.1)",
  },
  emptyDetailText: {
    fontSize: 16,
    fontWeight: 500,
    color: "rgba(255,255,255,0.3)",
  },
  emptyDetailSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.2)",
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
    borderLeft: "4px solid",
    paddingLeft: 16,
  },
  detailMerchant: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f8fafc",
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
    color: "rgba(255,255,255,0.4)",
  },
  riskSection: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "12px 16px",
  },
  riskLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
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
    height: 6,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  riskBarFillWide: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.4s ease",
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
    background: "rgba(255,255,255,0.03)",
    borderRadius: 6,
    padding: "8px 12px",
  },
  txFieldLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 3,
  },
  txFieldValue: {
    fontSize: 13,
    color: "#e2e8f0",
    fontVariantNumeric: "tabular-nums",
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sectionCount: {
    background: "rgba(255,255,255,0.08)",
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
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderLeft: "3px solid",
    borderRadius: 6,
    padding: "10px 14px",
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
    color: "rgba(255,255,255,0.35)",
  },
  viReason: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.4,
  },
  viRec: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginTop: 4,
    fontStyle: "italic",
  },
  viLinked: {
    fontSize: 10,
    color: "rgba(99,102,241,0.8)",
    marginTop: 4,
    background: "rgba(99,102,241,0.08)",
    borderRadius: 4,
    padding: "2px 6px",
    display: "inline-block",
  },
  aiSection: {
    background: "rgba(47,95,208,0.08)",
    border: "1px solid rgba(47,95,208,0.25)",
    borderRadius: 10,
    overflow: "hidden",
  },
  aiHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid rgba(47,95,208,0.15)",
  },
  aiIcon: {
    color: "#6e92e6",
    fontSize: 14,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6e92e6",
    flex: 1,
  },
  aiSpinner: {
    fontSize: 11,
    color: "rgba(110,146,230,0.6)",
    animation: "pulse 1s infinite",
  },
  aiBody: {
    padding: "12px 16px",
    minHeight: 60,
  },
  aiText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
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
    background: "rgba(255,255,255,0.07)",
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
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    cursor: "pointer",
  },
  btnEscalate: {
    flex: 1,
    padding: "9px 12px",
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 8,
    color: "#818cf8",
    fontSize: 13,
    cursor: "pointer",
  },
  btnFlag: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
