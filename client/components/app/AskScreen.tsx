"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import AppShell from "./AppShell";
import { dashboardKpis, fmtMoney } from "@/lib/analytics";

type ResultRow = Record<string, string | number | boolean | null | undefined>;
type Msg = {
  role: "user" | "assistant";
  content: string;
  chartType?: string | null;
  chartData?: ResultRow[];
  tableData?: ResultRow[];
};

const SUGGESTIONS = [
  "What are we spending the most on?",
  "Which fleet unit has the most violations?",
  "How has spend trended month over month?",
  "What's driving our compliance risk?",
];

export default function AskScreen() {
  const kpis = useMemo(() => dashboardKpis(), []);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply ?? "AI unavailable — check GEMINI_API_KEY in the backend environment.",
          chartType: data.chartType ?? null,
          chartData: Array.isArray(data.chartData) ? data.chartData : [],
          tableData: Array.isArray(data.tableData) ? data.tableData : [],
        },
      ]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong reaching the AI service." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      kicker="Hero Capability"
      title="Ask Brim"
      subtitle="ChatGPT for your fleet's spending. Ask in plain English — answers come from your real transaction data."
      fullBleed
    >
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 132px)", maxWidth: 820, margin: "0 auto", width: "100%", padding: "0 24px" }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 0", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", margin: "auto 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 40, color: "var(--accent)", marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Ask anything about your fleet spend</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {kpis.txCount.toLocaleString()} transactions · {fmtMoney(kpis.totalSpend, { compact: true })} analyzed
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24, maxWidth: 560 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="ux-btn ux-btn--sm" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "85%", padding: "12px 16px", borderRadius: 14, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  ...(m.role === "user"
                    ? { background: "var(--accent)", color: "#fff", borderBottomRightRadius: 4 }
                    : { background: "var(--fill-0)", border: "1px solid var(--line)", borderBottomLeftRadius: 4 }),
                }}
              >
                {m.role === "assistant" && <span style={{ color: "var(--accent)", fontWeight: 700, marginRight: 6 }}>✦</span>}
                {m.content}
                {m.role === "assistant" && ((m.chartData?.length || 0) > 0 || (m.tableData?.length || 0) > 0) && (
                  <ResultPreview rows={(m.tableData?.length ? m.tableData : m.chartData) ?? []} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "12px 16px", borderRadius: 14, background: "var(--fill-0)", border: "1px solid var(--line)", fontSize: 14, color: "var(--muted)", animation: "pulse 1.2s infinite" }}>
                ✦ analyzing your data…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{ padding: "16px 0 24px", display: "flex", gap: 8 }}
        >
          <div className="ux-input" style={{ flex: 1 }}>
            <span className="ux-input__ico">✦</span>
            <input
              placeholder="Ask about spend, vendors, compliance, fleet units…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="ux-btn ux-btn--primary" disabled={loading || !input.trim()}>Ask</button>
        </form>
      </div>
    </AppShell>
  );
}

function ResultPreview({ rows }: { rows: ResultRow[] }) {
  const previewRows = rows.slice(0, 5);
  if (previewRows.length === 0) return null;

  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      {previewRows.map((row, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "7px 0",
            borderTop: "1px solid var(--line-soft)",
            fontSize: 12.5,
          }}
        >
          <span style={{ color: "var(--ink-soft)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {labelForRow(row)}
          </span>
          <span style={{ fontWeight: 700, flex: "none" }}>{valueForRow(row)}</span>
        </div>
      ))}
    </div>
  );
}

function labelForRow(row: ResultRow) {
  return String(row.category ?? row.name ?? row.fleetUnit ?? row.violationType ?? row.month ?? row.metric ?? row.merchant ?? row.period ?? `Item ${row.rank ?? ""}`);
}

function valueForRow(row: ResultRow) {
  const raw = row.total ?? row.value ?? row.violationCount ?? row.count ?? row.amount;
  if (typeof raw === "number") {
    const label = "violationCount" in row || "count" in row || "metric" in row
      ? raw.toLocaleString()
      : `$${raw.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return label;
  }
  return raw == null ? "" : String(raw);
}
