'use client';

// @ts-nocheck
import React from "react";
import { Spec, Frame, Shell, TopBits, B, Ph, Panel } from "./primitives";

/* ============ 1. OVERVIEW ============ */
export function SecOverview() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Wireframe Concept · MVP · v1</div>
        <h1 className="sec-title">Brim — AI Expense Intelligence</h1>
        <p className="sec-lead">A finance team's command center for understanding and controlling SMB card spend.
          This document maps the information architecture, navigation, user journeys, and mid-fidelity wireframes
          for every major screen — annotated as a build-ready spec, before visual design begins.</p>
      </div>

      <div className="grid cols-4 mt20">
        <div className="card"><div className="card__icon">01</div><h4>Talk to Your Data</h4><p>Plain-English questions → charts, tables, summaries. Follow-ups that reason across departments & time. <b>The hero.</b></p></div>
        <div className="card"><div className="card__icon">02</div><h4>Policy Compliance</h4><p>Digitize the expense policy, auto-scan every transaction, flag & rank violations, surface repeat offenders.</p></div>
        <div className="card"><div className="card__icon">03</div><h4>Pre-Approval</h4><p>Requests arrive with history, budget status & an AI recommendation. Approver decides once.</p></div>
        <div className="card"><div className="card__icon">04</div><h4>Expense Reports</h4><p>Auto-group related transactions into a report, run policy checks, route for approval.</p></div>
      </div>

      <hr className="sec-divider" />

      <div className="grid cols-3">
        <div>
          <div className="eyebrow">Primary user</div>
          <h4 style={{ margin: "8px 0 4px" }}>Finance Manager / CFO</h4>
          <p className="soft fs14" style={{ margin: 0 }}>Non-technical. Owns spend visibility, policy, approvals and the monthly close. Wants answers, not spreadsheets. <b>Every screen below is designed for this persona.</b></p>
        </div>
        <div>
          <div className="eyebrow">Secondary</div>
          <h4 style={{ margin: "8px 0 4px" }}>Employee · Dept. Lead</h4>
          <p className="soft fs14" style={{ margin: 0 }}>Submits pre-approval requests, snaps receipts, views own report status. Served by a lightweight mobile companion (noted where relevant).</p>
        </div>
        <div>
          <div className="eyebrow">Platform</div>
          <h4 style={{ margin: "8px 0 4px" }}>Responsive web app</h4>
          <p className="soft fs14" style={{ margin: 0 }}>Desktop-first analytics workspace (≥1280px). Persistent left nav, dense data views, AI assistant always one keystroke away.</p>
        </div>
      </div>

      <div className="rationale mt24">
        <span className="rationale__lbl">Design principle</span>
        <p>"Make a non-technical manager smarter." Every screen leads with an answer or a recommendation — the raw data is always one click deeper, never the first thing you see.</p>
      </div>
    </div>
  );
}

/* ============ 2. PRODUCT ANALYSIS ============ */
export function SecAnalysis() {
  const flows = [
    ["Ask & explore", "Manager asks a question → AI returns a visual + summary → drills into follow-ups → pins to dashboard."],
    ["Set & enforce policy", "Define rules per department → system scans transactions → violations flagged & ranked → manager reviews."],
    ["Approve spend", "Employee requests → AI assembles context + recommendation → approver decides once → employee notified."],
    ["Close the books", "Trip/project transactions auto-grouped → policy-checked → report assembled → routed to CFO → exported."],
  ];
  const actions = ["Ask a question", "Pin a chart", "Create a policy rule", "Review a violation", "Approve / deny", "Request changes", "Generate report", "Match a receipt", "Set a budget", "Export / share", "Flag for review", "Add a note"];
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Section 01</div>
        <h1 className="sec-title">Product Analysis</h1>
        <p className="sec-lead">What the app is for, who uses it, and the core jobs it must do — distilled from the brief.</p>
      </div>

      <Panel title="Purpose">
        <p className="soft fs14 mb0">SMBs generate thousands of card transactions a month but lack tools to understand their own spend. Brim turns that
          transaction stream into <b>answers, enforcement, and decisions</b> — an AI layer that lets a finance team interrogate spending,
          codify policy, approve requests with context, and assemble expense reports automatically.</p>
      </Panel>

      <div className="grid cols-2 mt16">
        <Panel title="User types">
          <div className="col gap12">
            <div><span className="pill pill--ink">Primary</span> <b>Finance Manager / CFO</b><div className="fs13 muted">Analyze spend · author policy · approve · close books</div></div>
            <div><span className="pill">Secondary</span> <b>Employee</b><div className="fs13 muted">Request pre-approval · submit receipts · track own reports</div></div>
            <div><span className="pill">Secondary</span> <b>Department Lead</b><div className="fs13 muted">Owns a budget · first-line approver · watches dept burn</div></div>
            <div><span className="pill chip--dash">System</span> <b>Admin</b><div className="fs13 muted">Org setup · departments · users · data connections</div></div>
          </div>
        </Panel>
        <Panel title="Key features (required)">
          <ol className="soft fs14" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li><b>Conversational analytics</b> — ask, visualize, follow up, pin</li>
            <li><b>Policy compliance engine</b> — rules, auto-scan, severity ranking, repeat offenders, split-charge detection</li>
            <li><b>AI pre-approval workflow</b> — context-rich requests + recommendation, one-tap decision</li>
            <li><b>Automated expense reports</b> — grouping, policy checks, approval routing</li>
          </ol>
          <div className="wlabel mt12">Optional / roadmap</div>
          <p className="fs13 muted mb0">Anomaly & fraud detection · budget overrun forecasting · receipt matching · vendor consolidation · spending profiles & benchmarking.</p>
        </Panel>
      </div>

      <h4 className="mt24 mb8">Core user flows</h4>
      <div className="grid cols-2">
        {flows.map((f, i) => (
          <div className="flow__step" key={i}>
            <span className="flow__num">FLOW {String(i + 1).padStart(2, "0")}</span>
            <div className="flow__t">{f[0]}</div>
            <div className="flow__d">{f[1]}</div>
          </div>
        ))}
      </div>

      <h4 className="mt24 mb8">Important user actions</h4>
      <div className="row row--wrap gap8">
        {actions.map((a, i) => <span className="chip" key={i}><span className="sq sq--out" />{a}</span>)}
      </div>
    </div>
  );
}

/* ============ 3. SITEMAP ============ */
export function SecSitemap() {
  const tree = [
    ["A", "Dashboard", ["Spend command center", "Pinned answers", "Alerts feed", "Budget health"]],
    ["B", "Ask Brim", ["Chat analytics", "Saved questions", "Insight library", "Chart → pin / export"]],
    ["C", "Transactions", ["Browse / filter", "Transaction detail", "Bulk categorize", "Anomaly view"]],
    ["D", "Policy", ["Policy rules", "Violations queue", "Violation detail", "Repeat offenders", "Policy editor"]],
    ["E", "Approvals", ["Approval inbox", "Request detail", "Decision history", "Delegation"]],
    ["F", "Reports", ["Report list", "Report builder", "Report detail / review", "Export"]],
    ["G", "Settings & Admin", ["Profile", "Notifications", "Departments & budgets", "Members & roles", "Data connections"]],
  ];
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Section 02</div>
        <h1 className="sec-title">Sitemap</h1>
        <p className="sec-lead">Seven top-level areas. Flat and shallow — a finance manager reaches any task in ≤2 clicks from the persistent left nav.</p>
      </div>

      <div className="tcenter mb12"><span className="tree__root">Brim Workspace · authenticated</span></div>
      <div className="tree__row">
        {tree.map((t, i) => (
          <div className="tree__node" key={i}>
            <div className="h"><span className="k">{t[0]}</span>{t[1]}</div>
            <div className="tree__leafs">{t[2].map((leaf, j) => <div className="tree__leaf" key={j}>{leaf}</div>)}</div>
          </div>
        ))}
      </div>

      <div className="grid cols-2 mt24">
        <Panel title="Pre-auth & system">
          <div className="tree__leafs" style={{ padding: 0 }}>
            <div className="tree__leaf">Marketing splash → Sign up / Log in</div>
            <div className="tree__leaf">Workspace onboarding (connect data, import policy, set budgets)</div>
            <div className="tree__leaf">Invite acceptance (employee / lead)</div>
            <div className="tree__leaf">Empty states (pre-data, pre-policy, zero-results)</div>
            <div className="tree__leaf">Error states (404, permission, sync failure, AI unavailable)</div>
          </div>
        </Panel>
        <Panel title="Mobile companion (employee)">
          <div className="tree__leafs" style={{ padding: 0 }}>
            <div className="tree__leaf">Submit pre-approval request</div>
            <div className="tree__leaf">Snap & match receipt</div>
            <div className="tree__leaf">My requests & report status</div>
            <div className="tree__leaf">Push: decision received</div>
          </div>
          <p className="note mt12" style={{ fontSize: 17 }}>Manager-facing screens are the focus of this pass — mobile noted, not detailed.</p>
        </Panel>
      </div>
    </div>
  );
}

/* ============ 4. NAVIGATION ============ */
export function SecNav() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Section 03</div>
        <h1 className="sec-title">Navigation Structure</h1>
        <p className="sec-lead">A persistent left rail for primary areas, a global top bar for context + the always-available AI entry point.</p>
      </div>

      <Spec
        title="Global navigation model"
        sub="Applies to every authenticated screen"
        notes={[
          { n: 1, t: "<b>Left rail (primary nav).</b> Six work areas + Settings/Admin pinned to the bottom. Always visible; collapses to icons under 1100px." },
          { n: 2, t: "<b>Brand → Dashboard.</b> Logo doubles as 'home'. Workspace switcher lives here for multi-entity clients." },
          { n: 3, t: "<b>Global search.</b> Find any transaction, merchant, employee, report or policy rule. Cmd-K opens it anywhere." },
          { n: 4, t: "<b>Date-range context.</b> A single global period control most screens inherit (quarter default), so 'last quarter' means the same everywhere." },
          { n: 5, t: "<b>Notifications.</b> Bell with count → violations, approvals waiting, budget alerts. Routes into the relevant queue." },
          { n: 6, t: "<b>Ask Brim, always-on.</b> The hero capability is reachable from every screen via a persistent prompt bar — not buried in one tab." },
          { n: 7, t: "<b>Role chip.</b> Current role & account menu. Permissions gate Policy/Admin for non-finance roles." },
        ]}
        rationale="Finance work is non-linear — you jump from a question to a violation to an approval. A flat, always-present rail plus a global Ask bar keeps every job one click away."
      >
        <Frame>
          <Shell active="home" h="Dashboard" top={<TopBits />} minH={420}>
            <div className="row gap12" style={{ position: "relative" }}>
              <div className="grow">
                <div className="wpanel" style={{ minHeight: 150 }}>
                  <div className="wlabel">Persistent prompt bar <B n={6} /></div>
                  <div className="winput mt8" style={{ padding: "11px 13px" }}><span className="ico">✦</span>Ask Brim about your spend…</div>
                  <Ph label="screen content" h={70} style={{ marginTop: 12 }} />
                </div>
              </div>
            </div>
          </Shell>
          {/* floating badges over chrome regions */}
          <span className="badge badge--float" style={{ top: 64, left: 14 }}>2</span>
          <span className="badge badge--float" style={{ top: 150, left: 14 }}>1</span>
          <span className="badge badge--float" style={{ top: 60, left: 220 }}>3</span>
          <span className="badge badge--float" style={{ top: 60, right: 250 }}>4</span>
          <span className="badge badge--float" style={{ top: 60, right: 70 }}>5</span>
          <span className="badge badge--float" style={{ top: 60, right: 18 }}>7</span>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ 5. USER JOURNEYS ============ */
function Journey({ title, persona, steps }) {
  return (
    <div className="mt20">
      <div className="row center between mb8">
        <h4 style={{ margin: 0 }}>{title}</h4>
        <span className="pill"><span className="sq" />{persona}</span>
      </div>
      <div className="flow">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flow__step">
              <span className="flow__num">{String(i + 1).padStart(2, "0")}</span>
              <div className="flow__t">{s[0]}</div>
              <div className="flow__d">{s[1]}</div>
            </div>
            {i < steps.length - 1 && <div className="flow__arrow">→</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
export function SecJourneys() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Section 04</div>
        <h1 className="sec-title">User Journeys</h1>
        <p className="sec-lead">The four core flows from the brief, expressed as step sequences across screens. These drive the screen inventory that follows.</p>
      </div>

      <Journey title="J1 · Talk to your data" persona="Finance Manager"
        steps={[
          ["Open Dashboard", "Sees alerts, budget health, pinned answers"],
          ["Ask a question", "Types 'What did marketing spend on software last quarter?'"],
          ["Read the answer", "Bar chart + one-line summary returned"],
          ["Follow up", "'How does that compare to engineering?' — context kept"],
          ["Pin / export", "Saves chart to dashboard or exports to share"],
        ]} />

      <Journey title="J2 · Set & enforce policy" persona="Finance Manager"
        steps={[
          ["Open Policy", "Reviews existing rules by department"],
          ["Author a rule", "Sets limit, threshold, allowed categories"],
          ["System scans", "Every transaction checked, contextually"],
          ["Review violations", "Ranked by severity; split-charges surfaced"],
          ["Act", "Resolve, dismiss, or escalate to the employee"],
        ]} />

      <Journey title="J3 · Approve spend" persona="Approver / CFO"
        steps={[
          ["Notified", "Bell + email: request waiting"],
          ["Open request", "History, budget status, AI recommendation"],
          ["Decide once", "Approve / Deny / Request changes + note"],
          ["Auto-processed", "Employee notified, budget updated"],
        ]} />

      <Journey title="J4 · Close with auto reports" persona="CFO"
        steps={[
          ["Trigger", "10 trip transactions auto-grouped into a report"],
          ["Policy-checked", "Each line flagged compliant / needs review"],
          ["Review report", "Categories, totals, receipts attached"],
          ["Approve & export", "Routed, signed off, exported to accounting"],
        ]} />

      <div className="rationale mt24">
        <span className="rationale__lbl">Cross-flow insight</span>
        <p>All four journeys converge on two primitives — a <b>question</b> and a <b>decision</b>. The IA elevates both: Ask Brim is omnipresent, and every queue (violations, approvals, reports) is built around a single confident action.</p>
      </div>
    </div>
  );
}
