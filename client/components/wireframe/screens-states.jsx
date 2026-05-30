'use client';

// @ts-nocheck
import React from "react";
import { Spec, Frame, Shell, TopBits, B, Ph, Panel } from "./primitives";

/* ============ NOTIFICATIONS ============ */
export function SecNotifications() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Messages</div>
        <h1 className="sec-title">Notifications & Alerts</h1>
        <p className="sec-lead">Brim's proactive voice — approvals waiting, new violations, budget-overrun forecasts. Grouped, actionable, and each routes straight into the right queue.</p>
      </div>

      <Spec title="Notifications panel" sub="Opens from the top-bar bell"
        notes={[
          { n: 1, t: "<b>Grouped by type.</b> Approvals · Violations · Budget alerts · Reports — so a manager scans the category that matters now." },
          { n: 2, t: "<b>Actionable in place.</b> Approve / review without leaving the panel for routine items; deep-link for the rest." },
          { n: 3, t: "<b>Forecast alerts.</b> 'Marketing will exceed Q3 budget by week 8' — the optional forecasting capability surfaces here proactively." },
          { n: 4, t: "<b>Read / unread + filters.</b> Mark all read; filter to unread; per-channel settings link (email digest cadence)." },
        ]}
        rationale="Notifications are a workqueue, not noise. Grouping by the four core events and allowing in-place action keeps the bell from becoming something a manager learns to ignore.">
        <Frame>
          <Shell active="home" h="Dashboard" top={<TopBits />} minH={520}>
            <div style={{ position: "relative", minHeight: 460 }}>
              <Ph label="dashboard behind panel" h={440} style={{ opacity: .4 }} />
              <div style={{ position: "absolute", top: 0, right: 0, width: 380, background: "var(--fill-0)", border: "1px solid var(--line-strong)", borderRadius: 10, boxShadow: "var(--shadow-card)", padding: 14 }}>
                <div className="row between center mb8"><b>Notifications</b><span className="fs11 muted">Mark all read · ⚙<B n={4} /></span></div>
                <div className="row gap6 mb8"><span className="seg" style={{ fontSize: 11 }}><button className="is-active">All</button><button>Unread</button></span></div>
                {[["Approvals · 2", [["Sarah M · $1,200 conference", "approve"], ["D. Kim · $4,800 renewal", "approve"]]],
                  ["Violations · 3", [["Split charge · J. Lee · $600", "review"], ["Solo dinner · R. Diaz · $210", "review"]]],
                  ["Budget alerts · 1", [["Marketing → over Q3 by week 8", "view"]]]].map((g, i) => (
                  <div key={i} className="mt8">
                    <div className="wlabel mb6">{g[0]}{i === 0 && <B n={1} />}{i === 2 && <B n={3} />}</div>
                    <div className="col gap6">
                      {g[1].map((n, j) => (
                        <div key={j} className="wbox" style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="grow fs12">{n[0]}</div>
                          <span className="wbtn wbtn--sm">{n[1]}</span>{i === 0 && j === 0 && <B n={2} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ SETTINGS / ADMIN ============ */
export function SecSettings() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Account & Org</div>
        <h1 className="sec-title">Settings, Profile & Admin</h1>
        <p className="sec-lead">Personal preferences plus the org scaffolding the whole product rests on — departments, budgets, members & roles, and data connections.</p>
      </div>

      <Spec title="Admin — Departments & budgets" sub="Settings → Admin"
        notes={[
          { n: 1, t: "<b>Settings nav.</b> Two zones: personal (Profile, Notifications) and Admin (Departments, Members, Data) — gated by role." },
          { n: 2, t: "<b>Departments + budgets.</b> The structural backbone: every transaction, policy rule and approval is scoped to a department & its budget." },
          { n: 3, t: "<b>Per-period budget.</b> Set quarterly/annual budgets that feed dashboard health bars and approval context." },
          { n: 4, t: "<b>Owner / approver.</b> Each department has a lead who's the first-line approver — wires the approval routing." },
        ]}
        rationale="Departments and budgets aren't a settings afterthought — they're the spine the analytics, policy and approvals all hang on, so they get a first-class admin home.">
        <Frame>
          <Shell active="home" h="Settings · Admin" top={<TopBits />} minH={500}>
            <div className="row gap16" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 180, flex: "none" }}>
                <div className="wlabel mb8">Personal <B n={1} /></div>
                <div className="col gap4">
                  {["Profile", "Notifications", "Security"].map((s, i) => <div key={i} className="ui__nav"><span className="dot" />{s}</div>)}
                </div>
                <div className="wlabel mt16 mb8">Admin</div>
                <div className="col gap4">
                  {["Departments & budgets", "Members & roles", "Data connections", "Billing"].map((s, i) => <div key={i} className={"ui__nav" + (i === 0 ? " is-active" : "")}><span className="dot" />{s}</div>)}
                </div>
              </div>
              <div className="grow">
                <Panel title="Departments & budgets" action={<span className="wbtn wbtn--sm">＋ Add department</span>}>
                  <B n={2} />
                  <table className="wtable mt6">
                    <thead><tr><th>Department</th><th>Lead / approver <B n={4} /></th><th>Members</th><th className="num">Q2 budget <B n={3} /></th><th className="num">Used</th><th></th></tr></thead>
                    <tbody>
                      {[["Engineering", "D. Kim", "18", "$120k", "55%"], ["Marketing", "S. Marsh", "9", "$24k", "86%"], ["Sales", "J. Park", "12", "$80k", "92%"], ["Operations", "P. Adams", "6", "$40k", "40%"], ["G&A", "A. Bell", "5", "$30k", "68%"]].map((r, i) => (
                        <tr key={i}><td><b>{r[0]}</b></td><td>{r[1]}</td><td className="mono">{r[2]}</td><td className="num">{r[3]}</td><td className="num">{r[4]}</td><td><span className="wbtn wbtn--sm">Edit</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              </div>
            </div>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ EMPTY STATES ============ */
export function SecEmpty() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Edge cases</div>
        <h1 className="sec-title">Empty States</h1>
        <p className="sec-lead">The product is only as good as its first-run guidance. Each empty state teaches the next action rather than showing a blank panel.</p>
      </div>

      <div className="grid cols-3">
        <Spec title="Pre-data dashboard" sub="Before any feed is connected" wide
          notes={[{ n: 1, t: "<b>Guided next step.</b> Resume onboarding — connect the transaction feed to light up the dashboard." }]}
          rationale="A first-run zero state should sell the payoff and offer one button — not an empty grid.">
          <Frame><Shell active="home" h="Dashboard" minH={300}>
            <div className="tcenter" style={{ padding: "44px 20px" }}>
              <Ph label="empty" h={70} style={{ width: 70, margin: "0 auto", borderRadius: "50%" }} />
              <div className="bb mt16" style={{ fontSize: 16 }}>No spend data yet</div>
              <div className="fs13 muted mt6" style={{ maxWidth: 280, margin: "6px auto 0" }}>Connect your card feed and Brim will start surfacing answers within minutes.</div>
              <div className="wbtn wbtn--p mt16" style={{ display: "inline-flex" }}>Connect transaction feed<B n={1} /></div>
            </div>
          </Shell></Frame>
        </Spec>

        <Spec title="No violations" sub="Policy queue, all clear" wide
          notes={[{ n: 1, t: "<b>Positive empty.</b> Reassures rather than reads as broken; offers the next useful action." }]}
          rationale="An empty violations queue is good news — say so, and point to reviewing rules.">
          <Frame><Shell active="policy" h="Policy" minH={300}>
            <div className="tcenter" style={{ padding: "44px 20px" }}>
              <Ph label="✓" h={70} style={{ width: 70, margin: "0 auto", borderRadius: "50%" }} />
              <div className="bb mt16" style={{ fontSize: 16 }}>No open violations</div>
              <div className="fs13 muted mt6" style={{ maxWidth: 280, margin: "6px auto 0" }}>All 8,412 scanned transactions are within policy this period.</div>
              <div className="wbtn mt16" style={{ display: "inline-flex" }}>Review policy rules<B n={1} /></div>
            </div>
          </Shell></Frame>
        </Spec>

        <Spec title="Ask — no results" sub="Query returns nothing" wide
          notes={[{ n: 1, t: "<b>Recover, don't dead-end.</b> Explain why and offer reframed questions the AI can answer." }]}
          rationale="A no-result answer must teach the user how to ask a question that works.">
          <Frame><Shell active="ask" h="Ask Brim" minH={300}>
            <div style={{ maxWidth: 460, margin: "0 auto", paddingTop: 24 }}>
              <div className="bubble bubble--user mb12">What did the Tokyo office spend?</div>
              <div className="bubble bubble--ai">
                <div className="b mb6">I couldn't find a "Tokyo office" in your data.</div>
                <div className="fs12 muted">Your departments are Eng, Marketing, Sales, Ops, G&A. Try:</div>
                <div className="row gap6 row--wrap mt8"><span className="chip chip--dash">Spend by department</span><span className="chip chip--dash">Spend by location</span><B n={1} /></div>
              </div>
            </div>
          </Shell></Frame>
        </Spec>
      </div>
    </div>
  );
}

/* ============ ERROR STATES ============ */
export function SecError() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Edge cases</div>
        <h1 className="sec-title">Error States</h1>
        <p className="sec-lead">Things break — feeds fail to sync, the AI is briefly unavailable, permissions don't match. Each error stays calm, explains, and offers a way forward.</p>
      </div>

      <div className="grid cols-2">
        <Spec title="Data sync failure" sub="Banner + degraded state" wide
          notes={[
            { n: 1, t: "<b>Non-blocking banner.</b> Stale data is still shown (with a timestamp) rather than wiped — the manager isn't locked out." },
            { n: 2, t: "<b>Retry + status.</b> One-tap retry and a link to connection status / support." },
          ]}
          rationale="Finance data must never silently go missing. Surface the failure, keep last-good data visible, and make recovery one click.">
          <Frame><Shell active="home" h="Dashboard" minH={320}>
            <div className="wbox" style={{ borderColor: "var(--ink-marker)", background: "var(--marker-tint)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span>⚠</span><div className="grow fs13"><b>Couldn't sync the card feed.</b> Showing data as of <span className="mono">8:02am</span>.<B n={1} /></div><span className="wbtn wbtn--sm">Retry<B n={2} /></span><span className="wbtn wbtn--sm">Status</span>
            </div>
            <Ph label="dashboard (last-good data)" h={210} style={{ marginTop: 12, opacity: .7 }} />
          </Shell></Frame>
        </Spec>

        <Spec title="AI temporarily unavailable" sub="Ask Brim degraded" wide
          notes={[
            { n: 1, t: "<b>Graceful fallback.</b> Chat explains the assistant is down and points to manual browse/filter as a fallback path." },
            { n: 2, t: "<b>Preserve the question.</b> The typed query is kept so it can auto-retry when service returns." },
          ]}
          rationale="When the hero capability is down, don't strand the user — route them to the deterministic ledger and keep their question for retry.">
          <Frame><Shell active="ask" h="Ask Brim" minH={320}>
            <div style={{ maxWidth: 440, margin: "0 auto", paddingTop: 30 }}>
              <div className="bubble bubble--ai">
                <div className="b mb6">⚠ Brim's assistant is briefly unavailable.</div>
                <div className="fs12 muted">Your question is saved and will retry automatically. In the meantime you can browse transactions directly.</div>
                <div className="row gap6 mt8"><span className="wbtn wbtn--sm">Open Transactions<B n={1} /></span><span className="wbtn wbtn--sm">Retry now<B n={2} /></span></div>
              </div>
            </div>
          </Shell></Frame>
        </Spec>

        <Spec title="Permission denied" sub="Role lacks access" wide
          notes={[{ n: 1, t: "<b>Explain + route.</b> Non-finance roles hitting Policy/Admin get a clear reason and a request-access action — not a raw 403." }]}
          rationale="Role gating should educate, offering a path to request access rather than a dead wall.">
          <Frame><Shell active="policy" h="Policy" minH={300}>
            <div className="tcenter" style={{ padding: "44px 20px" }}>
              <Ph label="🔒" h={70} style={{ width: 70, margin: "0 auto", borderRadius: "50%" }} />
              <div className="bb mt16" style={{ fontSize: 16 }}>You don't have access to Policy</div>
              <div className="fs13 muted mt6" style={{ maxWidth: 300, margin: "6px auto 0" }}>Policy management is limited to Finance admins. Ask your workspace owner for access.</div>
              <div className="wbtn wbtn--p mt16" style={{ display: "inline-flex" }}>Request access<B n={1} /></div>
            </div>
          </Shell></Frame>
        </Spec>

        <Spec title="404 — not found" sub="Bad link / deleted record" wide
          notes={[{ n: 1, t: "<b>Stay oriented.</b> Friendly message + back-to-dashboard and global search so a dead link never traps the user." }]}
          rationale="Even a 404 keeps the persistent nav, so the user is one click from anywhere.">
          <Frame><Shell active="home" h="—" minH={300}>
            <div className="tcenter" style={{ padding: "44px 20px" }}>
              <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: "var(--faint)" }}>404</div>
              <div className="bb mt8" style={{ fontSize: 16 }}>We can't find that page</div>
              <div className="fs13 muted mt6">The link may be broken or the record was removed.</div>
              <div className="row gap8 mt16" style={{ justifyContent: "center" }}><span className="wbtn wbtn--p">Back to Dashboard<B n={1} /></span><span className="wbtn">Search</span></div>
            </div>
          </Shell></Frame>
        </Spec>
      </div>
    </div>
  );
}
