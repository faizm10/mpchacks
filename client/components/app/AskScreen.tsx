"use client";

import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

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
      textareaRef.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const hasThread = messages.length > 0 || loading;

  return (
    <AppShell fullBleed>
      <div className="ux-ask">
        <header className="ux-ask__topbar">
          <div className="ux-ask__topbar-inner">
            <div className="ux-ask__brand">
              <span className="ux-ask__brand-mark" aria-hidden>✦</span>
              <span className="ux-ask__brand-name">Ask Brim</span>
              <span className="ux-ask__brand-meta">Fleet spend</span>
            </div>
            {hasThread && (
              <button
                type="button"
                className="ux-ask__new"
                onClick={() => { setMessages([]); setInput(""); }}
              >
                New chat
              </button>
            )}
          </div>
        </header>

        <div ref={scrollRef} className="ux-ask__thread">
          <div className="ux-ask__thread-inner">
            {!hasThread && (
              <div className="ux-ask__welcome">
                <div className="ux-ask__welcome-icon" aria-hidden>✦</div>
                <h2 className="ux-ask__welcome-title">What can I help you with?</h2>
                <p className="ux-ask__welcome-sub">
                  Ask in plain English about spend, vendors, compliance, and fleet units.
                  <span className="ux-ask__welcome-meta">
                    {kpis.txCount.toLocaleString()} transactions · {fmtMoney(kpis.totalSpend, { compact: true })} analyzed
                  </span>
                </p>
                <div className="ux-ask__suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="ux-ask__suggestion" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <article
                key={i}
                className={`ux-ask__turn${m.role === "user" ? " ux-ask__turn--user" : " ux-ask__turn--assistant"}`}
              >
                {m.role === "assistant" && (
                  <div className="ux-ask__avatar" aria-hidden>✦</div>
                )}
                <div className="ux-ask__content">
                  {m.role === "user" ? (
                    <div className="ux-ask__user-bubble">{m.content}</div>
                  ) : (
                    <div className="ux-ask__assistant-text">{m.content}</div>
                  )}
                  {m.role === "assistant" && ((m.chartData?.length || 0) > 0 || (m.tableData?.length || 0) > 0) && (
                    <ResultPreview rows={(m.tableData?.length ? m.tableData : m.chartData) ?? []} />
                  )}
                </div>
              </article>
            ))}

            {loading && (
              <article className="ux-ask__turn ux-ask__turn--assistant">
                <div className="ux-ask__avatar" aria-hidden>✦</div>
                <div className="ux-ask__content">
                  <div className="ux-ask__typing" aria-live="polite" aria-label="Brim is thinking">
                    <span /><span /><span />
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>

        <footer className="ux-ask__composer-wrap">
          <form
            className="ux-ask__composer"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <div className="ux-ask__composer-box">
              <textarea
                ref={textareaRef}
                className="ux-ask__input"
                placeholder="Message Brim…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                autoFocus
              />
              <button
                type="submit"
                className="ux-ask__send"
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 4l0 16M12 4l6 6M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="ux-ask__hint">Brim can make mistakes. Verify important figures against your ledger.</p>
          </form>
        </footer>
      </div>
    </AppShell>
  );
}

function ResultPreview({ rows }: { rows: ResultRow[] }) {
  const previewRows = rows.slice(0, 5);
  if (previewRows.length === 0) return null;

  return (
    <div className="ux-ask__table">
      {previewRows.map((row, index) => (
        <div key={index} className="ux-ask__table-row">
          <span className="ux-ask__table-label">{labelForRow(row)}</span>
          <span className="ux-ask__table-value">{valueForRow(row)}</span>
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
