/* global React, Spec, Frame, Shell, TopBits, B, Ph, Panel, Bars, Stat */

/* ============ POLICY ENGINE + VIOLATIONS ============ */
function SecPolicy() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Compliance</div>
        <h1 className="sec-title">Policy Engine & Violations</h1>
        <p className="sec-lead">Digitize the expense policy, then let the system scan every transaction against it — flagging violations with context, ranking by severity, and surfacing repeat offenders.</p>
      </div>

      <Spec title="Violations queue" sub="Default Policy view"
        notes={[
          { n: 1, t: "<b>Severity-ranked list.</b> Highest-risk violations on top — the brief's 'rank violations by severity'. Sort/group by severity, department, employee, recency." },
          { n: 2, t: "<b>Context, not just rules.</b> Each row states what was violated and the AI's read — e.g. '$200 solo dinner' flagged where '$200 team dinner' wouldn't be." },
          { n: 3, t: "<b>Split-charge detection.</b> A dedicated flag type for structuring — '2× $300, 4 min apart, ducking the $500 threshold'. The brief's headline example." },
          { n: 4, t: "<b>Repeat offenders.</b> Side panel ranks employees by violation count/value so patterns surface, not just one-offs." },
          { n: 5, t: "<b>Filters + scan status.</b> Live count of transactions scanned; filter by rule, dept, status." },
          { n: 6, t: "<b>Row action.</b> Open detail to resolve, dismiss (with reason), or escalate to the employee." },
        ]}
        rationale="A queue, not a report. Severity ranking + repeat-offender context turns a wall of flags into a prioritized worklist a manager can clear top-down.">
        <Frame>
          <Shell active="policy" h="Policy · Violations" top={<TopBits />} minH={600}>
            <div className="row between center mb12">
              <div className="row gap8 row--wrap center">
                <span className="seg" style={{ fontSize: 12 }}><button className="is-active">Violations</button><button>Rules</button><button>Offenders</button></span>
                <span className="chip chip--dash">All depts ▾</span><span className="chip chip--dash">Severity ▾</span>
                <B n={5} />
              </div>
              <span className="fs12 muted mono">8,412 transactions scanned · 12 open</span>
            </div>
            <div className="row gap12" style={{ alignItems: "stretch" }}>
              <div className="grow" style={{ flex: 2 }}>
                <Panel title="Open violations · ranked by severity" style={{ height: "100%" }}>
                  <B n={1} />
                  <table className="wtable mt6">
                    <thead><tr><th>Severity</th><th>Violation</th><th>Employee · dept</th><th className="num">Amount</th><th></th></tr></thead>
                    <tbody>
                      <tr><td><span className="status status--strong">High</span></td><td><b>Split charge</b> · 2×$300, 4 min apart <B n={3} /></td><td>J. Lee · Sales</td><td className="num">$600</td><td><span className="wbtn wbtn--sm">Open<B n={6} /></span></td></tr>
                      <tr><td><span className="status status--strong">High</span></td><td>Restricted merchant (cash advance)</td><td>M. Okafor · Ops</td><td className="num">$450</td><td><span className="wbtn wbtn--sm">Open</span></td></tr>
                      <tr><td><span className="status">Med</span></td><td><b>$210 solo dinner</b> · limit $75 <B n={2} /></td><td>R. Diaz · Mktg</td><td className="num">$210</td><td><span className="wbtn wbtn--sm">Open</span></td></tr>
                      <tr><td><span className="status">Med</span></td><td>Missing receipt &gt; $75</td><td>S. Park · Eng</td><td className="num">$92</td><td><span className="wbtn wbtn--sm">Open</span></td></tr>
                      <tr><td><span className="status status--out">Low</span></td><td>Category not pre-approved</td><td>A. Bell · G&A</td><td className="num">$38</td><td><span className="wbtn wbtn--sm">Open</span></td></tr>
                    </tbody>
                  </table>
                </Panel>
              </div>
              <div className="grow">
                <Panel title="Repeat offenders" action={<span className="fs11 muted mono">this quarter</span>} style={{ height: "100%" }}>
                  <B n={4} />
                  <div className="col gap8 mt6">
                    {[["J. Lee · Sales", "5 violations", "$1,940"], ["R. Diaz · Mktg", "4 violations", "$680"], ["M. Okafor · Ops", "3 violations", "$910"]].map((o, i) => (
                      <div key={i} className="wbox" style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="ph" style={{ width: 26, height: 26, borderRadius: "50%", flex: "none" }}><span style={{ fontSize: 8 }}>{i + 1}</span></div>
                        <div className="grow"><div className="fs13 b">{o[0]}</div><div className="fs11 muted">{o[1]}</div></div>
                        <span className="mono fs12">{o[2]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rationale" style={{ marginTop: 12 }}><span className="rationale__lbl">AI note</span><p style={{ fontSize: 15 }}>Sales violations ▲ 40% since the new SDR hires — worth a policy refresher.</p></div>
                </Panel>
              </div>
            </div>
          </Shell>
        </Frame>
      </Spec>

      <Spec title="Policy rule editor" sub="Policy · Rules → edit"
        notes={[
          { n: 1, t: "<b>Rule anatomy.</b> Who it applies to (dept/role/everyone), the condition, the limit/threshold, and the action (flag / block / require approval)." },
          { n: 2, t: "<b>Scope by department & personnel.</b> The brief's 'set rules across departments and personnel' — different limits for Sales vs Eng." },
          { n: 3, t: "<b>Plain-English mirror.</b> The rule restated in a sentence so a non-technical manager confirms intent without parsing fields." },
          { n: 4, t: "<b>Test against history.</b> 'This rule would have flagged 14 past transactions' — preview impact before enabling." },
        ]}
        rationale="Rules are abstract; a plain-English mirror plus a retroactive test makes authoring them safe and legible for a finance manager who isn't a logician.">
        <Frame>
          <Shell active="policy" h="Policy · Edit rule" top={<TopBits />} minH={480}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <Panel title="Edit rule — Meals & entertainment">
                <div className="grid cols-2 gap12">
                  <div className="wfield"><div className="wlabel">Applies to <B n={2} /></div><div className="winput">Everyone ▾</div></div>
                  <div className="wfield"><div className="wlabel">Category</div><div className="winput">Meals & entertainment ▾</div></div>
                  <div className="wfield"><div className="wlabel">Condition <B n={1} /></div><div className="winput">Amount per person &gt; ▾</div></div>
                  <div className="wfield"><div className="wlabel">Limit</div><div className="winput">$75</div></div>
                  <div className="wfield"><div className="wlabel">If violated</div><div className="winput">Flag · severity Med ▾</div></div>
                  <div className="wfield"><div className="wlabel">Context exception</div><div className="winput">Allow if ≥3 attendees ▾</div></div>
                </div>
                <div className="rationale" style={{ marginTop: 14 }}>
                  <span className="rationale__lbl">In plain English <B n={3} /></span>
                  <p style={{ fontSize: 16 }}>Flag any meal over $75 per person — unless it's a team meal of 3 or more.</p>
                </div>
                <div className="wbox wbox--muted mt12" style={{ padding: "10px 12px" }}>
                  <span className="fs13">↻ This rule would have flagged <b>14</b> transactions in the last 6 months. <B n={4} /></span>
                </div>
                <div className="row between mt12"><span className="wbtn wbtn--ghost muted">Cancel</span><div className="row gap8"><span className="wbtn">Save as draft</span><span className="wbtn wbtn--p">Enable rule</span></div></div>
              </Panel>
            </div>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ PRE-APPROVAL WORKFLOW ============ */
function SecApprovals() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Decisions</div>
        <h1 className="sec-title">AI Pre-Approval Workflow</h1>
        <p className="sec-lead">When a transaction needs approval, the system hands the approver everything at once — the request, the employee's history, the budget status, and an AI recommendation with reasoning. They reply once. No back-and-forth.</p>
      </div>

      <Spec title="Approval inbox" sub="Approvals landing"
        notes={[
          { n: 1, t: "<b>Triage list.</b> Pending requests sorted by urgency (SLA age) and amount. Each row previews the AI recommendation so the easy ones can be cleared fast." },
          { n: 2, t: "<b>Recommendation at a glance.</b> Approve / Deny / Review tag right in the list — the manager trusts the obvious ones and slows down on the flagged ones." },
          { n: 3, t: "<b>Bulk approve.</b> Select all 'recommend approve, within policy' and clear in one action." },
          { n: 4, t: "<b>SLA / aging.</b> Time-waiting per request; overdue ones surface — the brief's 'waiting 26h'." },
        ]}
        rationale="Most requests are routine. Surfacing the AI verdict in the list lets a manager batch-clear the obvious and spend attention only where the recommendation is 'review.'">
        <Frame>
          <Shell active="approve" h="Approvals" top={<TopBits />} minH={520}>
            <div className="row between center mb12">
              <span className="seg" style={{ fontSize: 12 }}><button className="is-active">Pending · 7</button><button>Decided</button><button>Delegated</button></span>
              <span className="wbtn wbtn--sm">☑ Bulk approve recommended (4)<B n={3} /></span>
            </div>
            <Panel>
              <table className="wtable">
                <thead><tr><th>Request</th><th>Employee · dept</th><th className="num">Amount</th><th>Budget</th><th>AI rec</th><th>Waiting</th><th></th></tr></thead>
                <tbody>
                  {[["Conference registration", "Sarah M · Mktg", "$1,200", "$3.4k left", "Approve", "26h", "due"],
                    ["Annual SaaS renewal", "D. Kim · Eng", "$4,800", "$12k left", "Approve", "3h", ""],
                    ["Client dinner ×6", "J. Lee · Sales", "$540", "tight", "Review", "1h", ""],
                    ["New laptop", "A. Bell · G&A", "$2,200", "$900 left", "Review", "5h", ""],
                    ["Team offsite venue", "P. Adams · Ops", "$3,100", "$1.2k left", "Deny", "8h", ""]].map((r, i) => (
                    <tr key={i}>
                      <td><b>{r[0]}</b>{i === 0 && <B n={1} />}</td>
                      <td>{r[1]}</td>
                      <td className="num">{r[2]}</td>
                      <td className="fs11 muted">{r[3]}</td>
                      <td><span className={"status" + (r[4] === "Approve" ? " status--strong" : r[4] === "Deny" ? " status--out" : "")}>{r[4]}</span>{i === 0 && <B n={2} />}</td>
                      <td className="mono fs11">{r[5] === "26h" ? <b>{r[5]} ⚑</b> : r[5]}{i === 0 && <B n={4} />}</td>
                      <td><span className="wbtn wbtn--sm">Open</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </Shell>
        </Frame>
      </Spec>

      <Spec title="Request detail — decide once" sub="The brief's worked example, fully assembled"
        notes={[
          { n: 1, t: "<b>The request.</b> What, how much, why, when needed — plus any attached quote/receipt." },
          { n: 2, t: "<b>Employee spend history.</b> 'Attended 2 conferences this year' — pattern context so the decision isn't blind." },
          { n: 3, t: "<b>Department budget status.</b> '$3,400 remaining in Q2' — live, so approving here updates the dashboard." },
          { n: 4, t: "<b>AI recommendation + reasoning.</b> 'Approve — within policy, aligns with past pattern.' The reasoning is shown, not just a verdict, so the human stays in control." },
          { n: 5, t: "<b>Decide once.</b> Approve / Deny / Request changes + an optional note. One action processes everything; employee is auto-notified." },
          { n: 6, t: "<b>Policy check inline.</b> Confirms the request against active rules so approval and compliance are one step." },
        ]}
        rationale="The whole point of the brief: 'the approver replies once.' Everything needed to decide is on one screen, recommendation reasoning visible, action irreversible-but-simple.">
        <Frame>
          <Shell active="approve" h="Approvals · Request" top={<TopBits />} minH={560}>
            <div className="row gap12" style={{ alignItems: "stretch" }}>
              <div className="grow" style={{ flex: 1.4 }}>
                <Panel title="Request · Conference registration" style={{ height: "100%" }}>
                  <B n={1} />
                  <div className="grid cols-2 gap12 mt6">
                    <div><div className="wlabel">Requested by</div><div className="fs14 b">Sarah M · Marketing</div></div>
                    <div><div className="wlabel">Amount</div><div className="fs14 b mono">$1,200</div></div>
                    <div><div className="wlabel">Purpose</div><div className="fs13 soft">SaaStr Annual — speaking + lead gen</div></div>
                    <div><div className="wlabel">Needed by</div><div className="fs13 soft">Jun 14</div></div>
                  </div>
                  <Ph label="attached: registration quote.pdf" h={56} style={{ marginTop: 12 }} />
                  <div className="wbox wbox--muted mt12" style={{ padding: "9px 12px" }}><span className="fs13">✓ Passes all active policy rules <B n={6} /></span></div>

                  <div className="wlabel mt16 mb6">Employee spend history <B n={2} /></div>
                  <div className="row gap8 row--wrap">
                    <span className="chip"><span className="sq" />2 conferences YTD</span>
                    <span className="chip"><span className="sq sq--half" />0 violations</span>
                    <span className="chip"><span className="sq sq--out" />Avg request $940</span>
                  </div>
                  <Bars data={[30, 0, 60, 0, 0, 45]} hi={2} labels={["Jan", "", "Mar", "", "", "Jun"]} />
                </Panel>
              </div>
              <div className="grow">
                <Panel title="Marketing · Q2 budget" style={{ marginBottom: 12 }}>
                  <B n={3} />
                  <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>$3,400</div>
                  <div className="fs12 muted">remaining of $24k · 86% used</div>
                  <div className="wbox wbox--muted mt8" style={{ height: 8, borderRadius: 4, overflow: "hidden" }}><div style={{ width: "86%", height: "100%", background: "var(--ink-soft)" }} /></div>
                  <div className="fs11 muted mt8">This request → 35% of remaining</div>
                </Panel>
                <div className="wpanel" style={{ borderColor: "var(--ink-marker)", background: "var(--marker-tint)" }}>
                  <div className="wlabel" style={{ color: "var(--ink-marker)" }}>AI recommendation <B n={4} /></div>
                  <div className="b mt6 text-accent-ink" style={{ fontSize: 16 }}>✦ Approve</div>
                  <p className="fs13 mt6 text-accent-muted" style={{ margin: "6px 0 0" }}>Within policy and budget. Aligns with Sarah's past conference pattern (2 YTD, all on-budget). Expected ROI consistent with prior events.</p>
                </div>
                <div className="col gap8 mt12">
                  <div className="winput" style={{ minHeight: 52, alignItems: "flex-start", color: "var(--faint)" }}>Add a note (optional)…</div>
                  <div className="wbtn wbtn--marker" style={{ justifyContent: "center", padding: 11 }}>✓ Approve $1,200<B n={5} /></div>
                  <div className="row gap8"><span className="wbtn grow" style={{ justifyContent: "center" }}>Request changes</span><span className="wbtn grow" style={{ justifyContent: "center" }}>Deny</span></div>
                </div>
              </div>
            </div>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ EXPENSE REPORTS ============ */
function SecReports() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Close</div>
        <h1 className="sec-title">Automated Expense Reports</h1>
        <p className="sec-lead">The system groups related transactions into a report, runs real-time policy checks on every line, attaches receipts, and routes it for approval — the brief's 'Sarah's San Diego trip → 10 transactions → one report' scenario.</p>
      </div>

      <Spec title="Report detail — auto-assembled" sub="Reports → report"
        notes={[
          { n: 1, t: "<b>Auto-grouped header.</b> 'San Diego trip · 10 transactions' — Brim detected the cluster (time + place + employee) and named it. Manager confirms or edits the grouping." },
          { n: 2, t: "<b>Line items with categories.</b> Each transaction auto-categorized (airfare, hotel, meals, transit) and linked to spend categories." },
          { n: 3, t: "<b>Real-time policy check per line.</b> Compliant / needs-review badge on every row — the brief's 'real-time policy checks'." },
          { n: 4, t: "<b>Receipt matching.</b> Receipts auto-matched to lines; missing ones flagged for the employee." },
          { n: 5, t: "<b>Built-in approval.</b> 'Ready for CFO' — approve, with the policy recommendation summarized, then export to accounting." },
          { n: 6, t: "<b>Totals + category split.</b> Report total with a category breakdown for the books." },
        ]}
        rationale="The report shouldn't be authored — it should be confirmed. Brim does the grouping, categorizing, policy-checking and receipt-matching; the human's job is a quick scan and one sign-off.">
        <Frame>
          <Shell active="reports" h="Reports · San Diego trip" top={<TopBits />} minH={580}>
            <div className="row between center mb12">
              <div><div className="bb" style={{ fontSize: 16 }}>San Diego trip — Sarah M <B n={1} /></div><div className="fs12 muted">Auto-grouped · 10 transactions · Jun 3–7 · <span className="mono">$4,180</span></div></div>
              <div className="row gap8"><span className="wbtn wbtn--sm">Edit grouping</span><span className="status status--out">Ready for CFO</span></div>
            </div>
            <div className="row gap12" style={{ alignItems: "stretch" }}>
              <div className="grow" style={{ flex: 2 }}>
                <Panel style={{ height: "100%" }}>
                  <table className="wtable">
                    <thead><tr><th>Date</th><th>Merchant</th><th>Category <B n={2} /></th><th className="num">Amount</th><th>Policy <B n={3} /></th><th>Receipt <B n={4} /></th></tr></thead>
                    <tbody>
                      {[["Jun 3", "United Airlines", "Airfare", "$612", "ok", "✓"],
                        ["Jun 3", "Marriott", "Lodging", "$1,340", "ok", "✓"],
                        ["Jun 4", "Uber", "Transit", "$48", "ok", "✓"],
                        ["Jun 4", "Steakhouse 22", "Meals", "$210", "review", "✓"],
                        ["Jun 5", "Conference", "Registration", "$1,200", "ok", "✓"],
                        ["Jun 6", "Hotel bar", "Meals", "$96", "ok", "missing"]].map((r, i) => (
                        <tr key={i}>
                          <td className="mono fs11">{r[0]}</td><td>{r[1]}</td><td><span className="chip"><span className="sq sq--out" />{r[2]}</span></td><td className="num">{r[3]}</td>
                          <td>{r[4] === "ok" ? <span className="status">✓ ok</span> : <span className="status status--strong">review</span>}</td>
                          <td>{r[5] === "✓" ? <span className="fs12">✓</span> : <span className="status status--out">missing</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              </div>
              <div className="grow">
                <Panel title="Summary" style={{ marginBottom: 12 }}>
                  <B n={6} />
                  <div className="row center gap12"><div className="donut" /><div><div className="fs11 muted">Total</div><div className="mono bb" style={{ fontSize: 22 }}>$4,180</div></div></div>
                  <div className="col gap6 mt12">
                    {[["Lodging", "$1,340"], ["Registration", "$1,200"], ["Airfare", "$612"], ["Meals", "$306"], ["Transit", "$48"]].map((c, i) => (
                      <div key={i} className="row between fs12"><span className="soft">{c[0]}</span><span className="mono">{c[1]}</span></div>
                    ))}
                  </div>
                </Panel>
                <div className="wpanel" style={{ borderColor: "var(--ink-marker)", background: "var(--marker-tint)" }}>
                  <div className="wlabel" style={{ color: "var(--ink-marker)" }}>Policy recommendation <B n={5} /></div>
                  <p className="fs13 text-accent-muted" style={{ margin: "6px 0 0" }}>9 of 10 lines compliant. 1 meal needs review ($210, over per-person limit). 1 receipt missing. Recommend: approve with note.</p>
                </div>
                <div className="wbtn wbtn--marker mt12" style={{ justifyContent: "center", width: "100%", padding: 11 }}>✓ Approve & export to accounting</div>
              </div>
            </div>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

/* ============ TRANSACTIONS BROWSE + DETAIL ============ */
function SecTransactions() {
  return (
    <div>
      <div className="sec-head">
        <div className="sec-kicker">Screens · Data</div>
        <h1 className="sec-title">Transactions — Browse & Detail</h1>
        <p className="sec-lead">The raw ledger underneath everything. Powerful filtering, search, and bulk categorization — plus a detail view that ties a single charge to its policy checks, report, and AI context.</p>
      </div>

      <Spec title="Browse transactions" sub="Transactions landing"
        notes={[
          { n: 1, t: "<b>Faceted filters.</b> Department, category, merchant, amount range, date, policy status, card/employee. Stackable, with active-filter chips." },
          { n: 2, t: "<b>Search + Ask handoff.</b> Free-text search; an 'Ask Brim about these' button hands the current filter set to the analytics chat." },
          { n: 3, t: "<b>Dense, scannable table.</b> Sortable columns; flagged rows marked inline. Designed for thousands of rows with virtual scroll." },
          { n: 4, t: "<b>Bulk actions.</b> Select rows → recategorize, add to report, flag, export." },
          { n: 5, t: "<b>Inline anomaly marks.</b> Duplicate / round-number / unusual-merchant icons surface the optional fraud-detection signals." },
        ]}
        rationale="Even an AI-first product needs a trustworthy ledger. The escape hatch from any chart is 'show me the actual transactions' — and from here you can hand a filtered set straight back to Ask Brim.">
        <Frame>
          <Shell active="tx" h="Transactions" top={<TopBits />} minH={560}>
            <div className="row between center mb12">
              <div className="winput grow" style={{ maxWidth: 320 }}><span className="ico">⌕</span>Search merchant, amount, employee…<B n={2} /></div>
              <div className="row gap8"><span className="wbtn wbtn--sm">✦ Ask Brim about these</span><span className="wbtn wbtn--sm">⤓ Export</span></div>
            </div>
            <div className="row gap8 row--wrap mb12">
              <span className="chip chip--solid">Marketing ✕</span><span className="chip chip--solid">Q1 ✕</span><span className="chip chip--dash">＋ Category</span><span className="chip chip--dash">＋ Amount</span><span className="chip chip--dash">＋ Policy status</span><B n={1} />
            </div>
            <Panel>
              <div className="row between center mb8"><span className="wlabel">2,140 transactions</span><span className="wbtn wbtn--sm">☑ 3 selected · Bulk ▾<B n={4} /></span></div>
              <table className="wtable">
                <thead><tr><th>☐</th><th>Date</th><th>Merchant</th><th>Employee</th><th>Category</th><th className="num">Amount</th><th>Flags <B n={5} /></th></tr></thead>
                <tbody>
                  {[["Mar 22", "Figma", "D. Kim", "Software", "$144", ""],
                    ["Mar 21", "Steakhouse 22", "R. Diaz", "Meals", "$210", "⚑ over limit"],
                    ["Mar 21", "Vendor X", "J. Lee", "Office", "$300", "⚑ dup?"],
                    ["Mar 21", "Vendor X", "J. Lee", "Office", "$300", "⚑ dup?"],
                    ["Mar 20", "HubSpot", "S. Marsh", "Software", "$890", ""],
                    ["Mar 20", "Delta", "P. Adams", "Travel", "$500", "round #"]].map((r, i) => (
                    <tr key={i}>
                      <td><span className="chip" style={{ width: 14, height: 14, padding: 0, borderRadius: 3 }} /></td>
                      <td className="mono fs11">{r[0]}</td><td><b>{r[1]}</b></td><td className="fs12">{r[2]}</td><td><span className="chip"><span className="sq sq--out" />{r[3]}</span></td><td className="num">{r[4]}</td>
                      <td>{r[5] && <span className="status status--out">{r[5]}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <B n={3} />
            </Panel>
          </Shell>
        </Frame>
      </Spec>
    </div>
  );
}

Object.assign(window, { SecPolicy, SecApprovals, SecReports, SecTransactions });
