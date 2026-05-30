/* global React, Spec, Frame, Shell, TopBits, B, Ph, Panel, Bars, Stat */
const { useState: useStateCore } = React;

/* ============ AUTH (login / signup) ============ */
function SecAuth() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Access</div>
        <h1 className="sec-title">Login & Sign-up</h1>
        <p className="sec-lead">Workspace-based access for finance teams. SSO-first (most SMBs run Google/Microsoft), email fallback, invite-based seats.</p>
      </div>

      <div className="grid cols-2">
        <Spec title="Log in" sub="Returning user" wide
          notes={[
            { n: 1, t: "<b>Workspace context.</b> Logo + 'Sign in to Brim' — confirms which product/tenant." },
            { n: 2, t: "<b>SSO primary.</b> Google & Microsoft first; matches how SMB finance teams already authenticate." },
            { n: 3, t: "<b>Email fallback</b> below the divider for accounts without SSO." },
            { n: 4, t: "<b>Trust strip.</b> SOC-2 / bank-grade encryption reassurance — finance data is sensitive." },
          ]}
          rationale="Finance buyers won't enter card data into something that looks unsafe. Lead with SSO + a quiet security line.">
          <Frame url="app.brim.finance/login">
            <div style={{ padding: "40px 26px", background: "var(--paper)", minHeight: 360 }}>
              <div style={{ maxWidth: 320, margin: "0 auto" }}>
                <div className="row center gap8 mb12"><div className="ui__brandmark" /><b>Brim</b><B n={1} /></div>
                <div className="bb" style={{ fontSize: 19, marginBottom: 4 }}>Sign in to your workspace</div>
                <div className="fs13 muted mb12">Welcome back.</div>
                <div className="col gap8">
                  <div className="wbtn" style={{ justifyContent: "center", padding: 11 }}>Continue with Google<B n={2} /></div>
                  <div className="wbtn" style={{ justifyContent: "center", padding: 11 }}>Continue with Microsoft</div>
                </div>
                <div className="row center gap8 mt12 mb12"><div className="tline w40" style={{ height: 1 }} /><span className="fs11 muted">or</span><div className="tline w40" style={{ height: 1 }} /></div>
                <div className="wfield mb8"><div className="wlabel">Work email <B n={3} /></div><div className="winput">you@company.com</div></div>
                <div className="wfield"><div className="wlabel">Password</div><div className="winput">••••••••</div></div>
                <div className="wbtn wbtn--p mt12" style={{ justifyContent: "center", width: "100%", padding: 11 }}>Sign in</div>
                <div className="fs11 muted tcenter mt12">🔒 SOC-2 Type II · bank-grade encryption <B n={4} /></div>
              </div>
            </div>
          </Frame>
        </Spec>

        <Spec title="Sign up" sub="New workspace" wide
          notes={[
            { n: 1, t: "<b>Create vs. join.</b> Toggle between starting a new company workspace and accepting an invite." },
            { n: 2, t: "<b>Minimal fields.</b> Name, work email, company. Everything else (departments, budgets, data) happens in guided onboarding." },
            { n: 3, t: "<b>Role hint.</b> First user becomes workspace owner / CFO admin by default." },
            { n: 4, t: "<b>Single CTA.</b> No card required to start — reduces friction for an evaluation." },
          ]}
          rationale="Don't front-load setup into the signup form. Capture the minimum, then drive into an onboarding wizard that does the heavy lifting.">
          <Frame url="app.brim.finance/signup">
            <div style={{ padding: "34px 26px", background: "var(--paper)", minHeight: 360 }}>
              <div style={{ maxWidth: 320, margin: "0 auto" }}>
                <div className="seg mb12"><button className="is-active">Create workspace</button><button>Join with invite</button></div>
                <B n={1} />
                <div className="col gap8 mt8">
                  <div className="wfield"><div className="wlabel">Your name</div><div className="winput">Full name</div></div>
                  <div className="wfield"><div className="wlabel">Work email <B n={2} /></div><div className="winput">you@company.com</div></div>
                  <div className="wfield"><div className="wlabel">Company</div><div className="winput">Company name</div></div>
                </div>
                <div className="fs11 muted mt8">You'll be the workspace owner (CFO/admin). <B n={3} /></div>
                <div className="wbtn wbtn--p mt12" style={{ justifyContent: "center", width: "100%", padding: 11 }}>Create workspace — no card needed<B n={4} /></div>
              </div>
            </div>
          </Frame>
        </Spec>
      </div>
    </div>
  );
}

/* ============ ONBOARDING WIZARD ============ */
function SecOnboarding() {
  const steps = ["Connect data", "Import policy", "Map departments", "Set budgets", "Invite team"];
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · First run</div>
        <h1 className="sec-title">Workspace Onboarding</h1>
        <p className="sec-lead">A 5-step guided setup that turns a raw transaction feed + a policy doc into a working intelligence layer. Skippable, resumable.</p>
      </div>

      <Spec title="Onboarding wizard — Step 2 of 5: Import policy" sub="Guided setup"
        notes={[
          { n: 1, t: "<b>Progress spine.</b> Five steps, current highlighted. Each maps to a 'What You Get' input from the brief — data, then policy, then structure." },
          { n: 2, t: "<b>Upload the policy doc.</b> Drop the company expense policy PDF/DOC; AI parses spend limits, thresholds, categories & restricted merchants." },
          { n: 3, t: "<b>AI-extracted rules preview.</b> Parsed rules shown as editable cards so the manager confirms rather than types from scratch." },
          { n: 4, t: "<b>Confidence + edit.</b> Each extracted rule shows a confidence tag; low-confidence items prompt review. Builds trust in the automation early." },
          { n: 5, t: "<b>Skip / save & continue.</b> Nothing is mandatory in one sitting — setup is resumable from the Dashboard empty state." },
        ]}
        rationale="The brief hands teams a policy document. Parsing it into editable rules is the single highest-leverage onboarding moment — it makes the Policy Engine feel instant instead of like data entry.">
        <Frame url="app.brim.finance/onboarding">
          <div style={{ display: "flex", minHeight: 460 }}>
            <div style={{ width: 210, background: "var(--fill-1)", borderRight: "1px solid var(--line)", padding: 20 }}>
              <div className="row center gap8 mb12"><div className="ui__brandmark" /><b>Set up Brim</b></div>
              <div className="col gap8 mt8">
                {steps.map((s, i) => (
                  <div key={i} className="row center gap8">
                    <div className="anote__n" style={{ background: i === 1 ? "var(--ink-marker)" : (i < 1 ? "var(--ink)" : "var(--fill-3)"), color: i <= 1 ? "#fff" : "var(--muted)" }}>{i < 1 ? "✓" : i + 1}</div>
                    <span className={"fs13 " + (i === 1 ? "bb" : "muted")}>{s}</span>
                  </div>
                ))}
              </div>
              <B n={1} />
            </div>
            <div style={{ flex: 1, padding: 24, background: "var(--paper)" }}>
              <div className="bb" style={{ fontSize: 18 }}>Import your expense policy</div>
              <div className="fs13 muted mb12">We'll read it and turn it into rules you can edit.</div>
              <Ph label="⬆ drop policy.pdf  ·  or browse" h={92} />
              <B n={2} />
              <div className="wlabel mt16 mb8">Extracted rules — review & confirm <B n={3} /></div>
              <div className="col gap8">
                {[["Meals & entertainment", "≤ $75 / person", "High"], ["Approval threshold", "> $500 needs sign-off", "High"], ["Restricted: gambling, cash advance", "Always block", "Med"], ["Software", "Dept-budget bound", "Low — review"]].map((r, i) => (
                  <div key={i} className="wbox" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="grow"><div className="fs13 b">{r[0]}</div><div className="fs12 muted mono">{r[1]}</div></div>
                    <span className={"status" + (r[2].includes("Low") ? " status--out" : "")}>{r[2]} conf{i === 3 && <B n={4} />}</span>
                    <span className="wbtn wbtn--sm">Edit</span>
                  </div>
                ))}
              </div>
              <div className="row between mt16"><span className="wbtn wbtn--ghost muted">Skip for now <B n={5} /></span><span className="wbtn wbtn--p">Save & continue →</span></div>
            </div>
          </div>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ DASHBOARD ============ */
function SecDashboard() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Home</div>
        <h1 className="sec-title">Dashboard — Command Center</h1>
        <p className="sec-lead">The first thing a finance manager sees each morning: what needs attention, how budgets are tracking, and the answers they pinned — with Ask Brim sitting right on top.</p>
      </div>

      <Spec title="Dashboard" sub="Default landing, role = CFO"
        notes={[
          { n: 1, t: "<b>Ask Brim, front and center.</b> The hero capability greets you on the home screen — start a question without navigating anywhere." },
          { n: 2, t: "<b>Attention feed.</b> The day's triage: violations to review, approvals waiting, budget alerts. Each row deep-links into its queue. This is the manager's to-do list." },
          { n: 3, t: "<b>KPI band.</b> Total spend, vs. budget, open approvals, flagged violations — period-scoped by the global date control." },
          { n: 4, t: "<b>Budget health by department.</b> Bar-per-department with projected overrun marks. Answers 'are we on track?' at a glance." },
          { n: 5, t: "<b>Pinned answers.</b> Charts the manager saved from Ask Brim live here as living widgets — re-run on each visit." },
          { n: 6, t: "<b>Spend trend.</b> Rolling spend line for context behind the KPIs." },
        ]}
        rationale="A dashboard for a non-technical manager should answer 'what needs me?' before 'here's all your data.' Attention feed and Ask sit above the fold; raw charts support, not lead.">
        <Frame>
          <Shell active="home" h="Dashboard" top={<TopBits />} minH={600}>
            <div className="wpanel mb12">
              <div className="winput" style={{ padding: "12px 14px", fontSize: 13 }}><span className="ico">✦</span>Ask Brim — “What did marketing spend on software last quarter?”<B n={1} /></div>
            </div>

            <div className="grid cols-4 mb12">
              <Stat label="Total spend · QTD" value="$412k" sub="▲ 6% vs last Q" n={3} />
              <Stat label="vs. budget" value="78%" sub="$118k remaining" />
              <Stat label="Open approvals" value="7" sub="2 over 24h" />
              <Stat label="Open violations" value="12" sub="3 high severity" />
            </div>

            <div className="row gap12" style={{ alignItems: "stretch" }}>
              <div className="grow" style={{ flex: 1.3 }}>
                <Panel title="Needs your attention" action={<span className="wbtn wbtn--sm">View all</span>} style={{ height: "100%" }}>
                  <B n={2} />
                  <div className="col gap8 mt6">
                    {[["⚑", "Split-charge suspected", "J. Lee · 2× $300 at same vendor, 4 min apart", "High"],
                      ["⏳", "Approval waiting 26h", "Sarah M · $1,200 conference registration", "Due"],
                      ["▲", "Marketing projected over Q3", "by ~$4.2k at current burn", "Alert"],
                      ["⚑", "Out-of-policy meal", "R. Diaz · $210 solo dinner (limit $75)", "Med"]].map((r, i) => (
                      <div key={i} className="wbox" style={{ padding: "9px 11px", display: "flex", gap: 10, alignItems: "center" }}>
                        <span className="mono muted">{r[0]}</span>
                        <div className="grow"><div className="fs13 b">{r[1]}</div><div className="fs12 muted">{r[2]}</div></div>
                        <span className={"status" + (r[3] === "High" ? " status--strong" : "")}>{r[3]}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
              <div className="grow">
                <Panel title="Budget health" action={<span className="fs11 muted mono">by dept</span>}>
                  <B n={4} />
                  <Bars data={[55, 78, 92, 40, 68]} hi={2} labels={["Eng", "Mktg", "Sales", "Ops", "G&A"]} />
                  <div className="fs11 muted mt20">Sales 92% — projected overrun ▲</div>
                </Panel>
              </div>
            </div>

            <div className="grid cols-2 mt12">
              <Panel title="Pinned answer · Software spend by dept" action={<span className="status status--out">pinned</span>}>
                <B n={5} /><Bars data={[80, 45, 30, 20]} hi={0} labels={["Eng", "Mktg", "Sales", "Ops"]} />
              </Panel>
              <Panel title="Spend trend · 6 months">
                <B n={6} />
                <div className="linechart"><div className="axis" /><Ph label="line chart — monthly spend" h={120} style={{ border: 0, background: "transparent" }} /></div>
              </Panel>
            </div>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ TALK TO YOUR DATA (HERO — 3 directions) ============ */
function SecAsk() {
  const [dir, setDir] = useStateCore("a");
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Hero capability</div>
        <h1 className="sec-title">Talk to Your Data</h1>
        <p className="sec-lead">"ChatGPT for your company's spending." Ask in plain English, get the right visualization back, follow up without re-explaining context.
          This is the product's centerpiece — so here are <b>three layout directions</b> to pressure-test before committing.</p>
      </div>

      <div className="row center gap12 mb12">
        <div className="seg">
          <button className={dir === "a" ? "is-active" : ""} onClick={() => setDir("a")}>A · Conversation-led</button>
          <button className={dir === "b" ? "is-active" : ""} onClick={() => setDir("b")}>B · Split canvas</button>
          <button className={dir === "c" ? "is-active" : ""} onClick={() => setDir("c")}>C · Notebook</button>
        </div>
        <span className="note">pick a direction →</span>
      </div>

      {dir === "a" && (
        <Spec title="Direction A — Conversation-led" sub="Chat is the whole screen; visuals render inline"
          notes={[
            { n: 1, t: "<b>Single chat column.</b> Familiar, low-intimidation. Each AI turn can contain a chart, table or summary inline." },
            { n: 2, t: "<b>Answer-first bubbles.</b> AI leads with a one-line summary, then the visual, then a 'why' — so a non-technical manager reads the takeaway first." },
            { n: 3, t: "<b>Follow-up retains context.</b> 'How does that compare to engineering?' updates the same thread — no re-explaining." },
            { n: 4, t: "<b>Inline actions per answer.</b> Pin to dashboard · export · view underlying transactions · change chart type." },
            { n: 5, t: "<b>Suggested follow-ups.</b> AI proposes next questions to guide exploration." },
            { n: 6, t: "<b>Prompt bar with scope chips.</b> Attach department/time filters to constrain the question precisely." },
          ]}
          rationale="Best for the least-technical users and demos — it reads exactly like the 'ChatGPT for spending' promise. Risk: long analyses get scroll-heavy. Recommended default for MVP.">
          <Frame>
            <Shell active="ask" h="Ask Brim" top={<TopBits />} minH={600}>
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <div className="bubble bubble--user mb12">What did marketing spend on software last quarter?</div>
                <div className="bubble bubble--ai mb12" style={{ maxWidth: "92%" }}>
                  <div className="b mb6">Marketing spent <b>$48,200</b> on software in Q1 — 18% of its budget. <B n={2} /></div>
                  <Bars data={[70, 40, 55, 90]} hi={3} labels={["Jan", "Feb", "Mar", "—"]} />
                  <div className="fs12 muted mt20">Top vendors: Figma, HubSpot, Semrush. ▲ 12% vs prior quarter.</div>
                  <div className="row gap8 mt12 row--wrap">
                    <span className="wbtn wbtn--sm">📌 Pin to dashboard</span><span className="wbtn wbtn--sm">⤓ Export</span><span className="wbtn wbtn--sm">View 24 transactions</span><span className="wbtn wbtn--sm">Chart type ▾</span>
                  </div>
                  <B n={4} />
                </div>
                <div className="bubble bubble--user mb12">How does that compare to engineering?<B n={3} /></div>
                <div className="bubble bubble--ai mb12" style={{ maxWidth: "92%" }}>
                  <div className="b mb6">Engineering spent <b>$96,500</b> — 2× marketing, mostly cloud infra.</div>
                  <Bars data={[48, 96]} hi={1} labels={["Mktg", "Eng"]} />
                </div>
                <div className="row gap8 row--wrap mb12">
                  <span className="chip chip--dash">Compare to sales too</span><span className="chip chip--dash">Break down by vendor</span><span className="chip chip--dash">Show monthly trend</span>
                  <B n={5} />
                </div>
                <div className="winput" style={{ padding: "11px 13px" }}><span className="ico">✦</span>Ask a follow-up…<span className="grow" /><span className="chip">＋ Q1</span><span className="chip">＋ Marketing</span><B n={6} /></div>
              </div>
            </Shell>
          </Frame>
        </Spec>
      )}

      {dir === "b" && (
        <Spec title="Direction B — Split canvas" sub="Chat thread left, persistent visualization canvas right"
          notes={[
            { n: 1, t: "<b>Conversation rail (left).</b> Compact Q&A history; clicking a turn re-loads its visual on the canvas." },
            { n: 2, t: "<b>Big canvas (right).</b> The current visualization gets real estate — better for dense charts, tables, comparisons." },
            { n: 3, t: "<b>Canvas controls.</b> Chart type, breakdown, drill — manipulate the active answer without re-asking." },
            { n: 4, t: "<b>Pin builds a dashboard.</b> The canvas is also where you assemble a custom report from several answers." },
            { n: 5, t: "<b>Underlying data drawer.</b> Slide-up table of the exact transactions behind the chart — auditability." },
          ]}
          rationale="Best for power analysts and longer sessions — visuals stay large and manipulable. Risk: busier, slightly less 'magical' than pure chat. Strong fast-follow to A.">
          <Frame>
            <Shell active="ask" h="Ask Brim" top={<TopBits />} minH={600}>
              <div className="row gap12" style={{ alignItems: "stretch", minHeight: 480 }}>
                <div style={{ width: 260, flex: "none" }}>
                  <Panel title="Conversation" style={{ height: "100%" }}>
                    <B n={1} />
                    <div className="col gap8 mt6">
                      <div className="wbox" style={{ padding: "9px 10px" }}><div className="fs12 b">Marketing software spend</div><div className="fs11 muted">Q1 · $48,200</div></div>
                      <div className="wbox" style={{ padding: "9px 10px", borderColor: "var(--ink-marker)" }}><div className="fs12 b">vs. engineering</div><div className="fs11 muted">$96,500 · active</div></div>
                      <div className="bubble bubble--ai" style={{ fontSize: 12, maxWidth: "100%" }}>Want me to add Sales for a full comparison?</div>
                    </div>
                    <div className="winput mt12" style={{ padding: "9px 11px", fontSize: 12 }}><span className="ico">✦</span>Ask…</div>
                  </Panel>
                </div>
                <div className="grow">
                  <Panel title="Marketing vs. Engineering — software · Q1" action={<div className="row gap6"><span className="wbtn wbtn--sm">Bar ▾</span><span className="wbtn wbtn--sm">📌 Pin</span><span className="wbtn wbtn--sm">⤓</span></div>} style={{ height: "100%" }}>
                    <B n={2} /><span style={{ float: "right" }}><B n={3} /></span>
                    <Bars data={[48, 96, 0, 0]} hi={1} labels={["Mktg", "Eng", "+ Sales?", ""]} />
                    <div className="wbox wbox--muted mt24" style={{ padding: 10 }}>
                      <div className="row between center"><span className="wlabel">Underlying transactions · 24 rows <B n={5} /></span><span className="wbtn wbtn--sm">Expand ▾</span></div>
                    </div>
                    <div className="rationale" style={{ marginTop: 12 }}><span className="rationale__lbl">canvas = report builder</span><p style={{ fontSize: 16 }}>Pinned answers stack here into a shareable view. <B n={4} /></p></div>
                  </Panel>
                </div>
              </div>
            </Shell>
          </Frame>
        </Spec>
      )}

      {dir === "c" && (
        <Spec title="Direction C — Analyst notebook" sub="Stacked cells of question → answer, re-runnable & reorderable"
          notes={[
            { n: 1, t: "<b>Cells, not a feed.</b> Each question/answer is a numbered cell you can edit, re-run, reorder or delete — like a finance notebook." },
            { n: 2, t: "<b>Re-runnable.</b> Cells stay live; on each visit the figures refresh against latest data. Great for recurring monthly reviews." },
            { n: 3, t: "<b>Save the notebook.</b> A whole analysis ('Q1 board review') is saved & re-shared, not just single charts." },
            { n: 4, t: "<b>Per-cell visual type.</b> Each cell remembers chart vs. table vs. summary." },
            { n: 5, t: "<b>Add cell / templates.</b> Insert from a library of common finance questions." },
          ]}
          rationale="Best for repeatable reporting (monthly close, board prep) — codifies an analysis as a living artifact. Risk: higher concept-load for a non-technical user. Roadmap, not MVP.">
          <Frame>
            <Shell active="ask" h="Ask Brim · Notebook" top={<TopBits />} minH={600}>
              <div className="row between center mb12"><div><div className="bb" style={{ fontSize: 16 }}>Q1 Board Review</div><div className="fs12 muted">Auto-refreshes · last run today<B n={3} /></div></div><span className="wbtn wbtn--sm">⤓ Share notebook</span></div>
              {[["1", "Total company spend, Q1, by month", "summary + line"], ["2", "Software spend — marketing vs engineering", "bar"], ["3", "Top 10 vendors by spend", "table"]].map((c, i) => (
                <div key={i} className="wpanel mb12">
                  <div className="row center gap8 mb8"><span className="anote__n" style={{ background: "var(--fill-3)", color: "var(--ink)" }}>{c[0]}</span><div className="winput grow" style={{ padding: "7px 11px", fontSize: 12 }}>{c[1]}</div><span className="status status--out mono">{c[2]}<B n={4} /></span><span className="wbtn wbtn--sm">↻ Re-run<B n={2} /></span></div>
                  {i === 0 && <Ph label="line — monthly spend" h={90} />}
                  {i === 1 && <Bars data={[48, 96]} hi={1} labels={["Mktg", "Eng"]} />}
                  {i === 2 && <Ph label="table — top vendors" h={90} />}
                  {i === 0 && <B n={1} />}
                </div>
              ))}
              <div className="wbox wbox--muted tcenter" style={{ padding: 14, borderStyle: "dashed" }}><span className="muted fs13">＋ Add cell</span> · <span className="muted fs13">from template ▾<B n={5} /></span></div>
            </Shell>
          </Frame>
        </Spec>
      )}

      <div className="rationale mt16">
        <span className="rationale__lbl">Recommendation</span>
        <p>Ship <b>A (conversation-led)</b> for the MVP — it delivers the brief's promise most directly and is the easiest to demo. Borrow B's "view underlying transactions" drawer for auditability. Hold C for a later "saved analyses" release.</p>
      </div>
    </div>
  );
}

Object.assign(window, { SecAuth, SecOnboarding, SecDashboard, SecAsk });
