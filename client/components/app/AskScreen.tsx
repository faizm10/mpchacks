"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import AppShell from "./AppShell";
import { dashboardKpis, fmtMoney } from "@/lib/analytics";

type Msg = { role: "user" | "assistant"; content: string };

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
      setMessages([...next, { role: "assistant", content: data.reply ?? "AI unavailable — check ANTHROPIC_API_KEY in the server environment." }]);
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
