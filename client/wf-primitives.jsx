/* global React */
const { useState } = React;

/* ---------- tiny atoms ---------- */
function TLine({ w = "w80" }) { return <span className={"tline " + w} />; }
function TLines({ lines = [["w90"], ["w70"]] }) {
  return <div>{lines.map((l, i) => <TLine key={i} w={l[0]} />)}</div>;
}
function Ph({ label, h = 80, style }) {
  return <div className="ph" style={{ height: h, ...style }}><span>{label}</span></div>;
}
function WLabel({ children }) { return <div className="wlabel">{children}</div>; }

/* numbered badge that sits on a wireframe element; rail explains it */
function B({ n }) { return <span className="badge">{n}</span>; }

/* annotation rail */
function Notes({ items, title = "Annotations" }) {
  return (
    <div className="rail-notes">
      <div className="rail-notes__hd">{title}</div>
      {items.map((it, i) => (
        <div className="anote" key={i}>
          <div className="anote__n">{it.n}</div>
          <div className="anote__t" dangerouslySetInnerHTML={{ __html: it.t }} />
        </div>
      ))}
    </div>
  );
}

/* screen spec wrapper: title bar + (frame | rail) + rationale */
function Spec({ no, title, sub, children, notes, rationale, wide }) {
  return (
    <div className="spec">
      <div className="spec__bar">
        {no && <span className="spec__no">{no}</span>}
        <h3 className="spec__title">{title}</h3>
        {sub && <span className="spec__sub">{sub}</span>}
      </div>
      <div className={"spec__body" + (wide ? " spec__body--wide" : "")}>
        <div className="grow">{children}</div>
        {notes && <Notes items={notes} />}
      </div>
      {rationale && (
        <div className="rationale">
          <span className="rationale__lbl">UX rationale</span>
          <p>{rationale}</p>
        </div>
      )}
    </div>
  );
}

/* browser/app chrome frame */
function Frame({ url = "app.brim.finance", children }) {
  return (
    <div className="frame">
      <div className="frame__chrome">
        <div className="frame__dots"><i /><i /><i /></div>
        <div className="frame__url">{url}</div>
      </div>
      <div className="frame__body">{children}</div>
    </div>
  );
}

/* in-app shell: left nav + topbar. nav = [{label, key, badge}], active key */
const NAV = [
  { k: "home", label: "Dashboard" },
  { k: "ask", label: "Ask Brim" },
  { k: "tx", label: "Transactions" },
  { k: "policy", label: "Policy" },
  { k: "approve", label: "Approvals" },
  { k: "reports", label: "Reports" },
];
function Shell({ active = "home", h = "Dashboard", top, children, minH = 540 }) {
  return (
    <div className="ui" style={{ minHeight: minH }}>
      <div className="ui__side">
        <div className="ui__brand"><div className="ui__brandmark" /><div className="ui__brandname">Brim</div></div>
        {NAV.map(n => (
          <div key={n.k} className={"ui__nav" + (n.k === active ? " is-active" : "")}>
            <span className="dot" />{n.label}
          </div>
        ))}
        <div className="ui__navspacer" />
        <div className="ui__nav"><span className="dot" />Settings</div>
        <div className="ui__nav"><span className="dot" />Admin</div>
      </div>
      <div className="ui__main">
        <div className="ui__top">
          <div className="ui__h">{h}</div>
          <div className="ui__topspacer" />
          {top}
        </div>
        <div className="ui__content">{children}</div>
      </div>
    </div>
  );
}

/* common topbar widgets */
function TopBits() {
  return (
    <div className="row center gap8">
      <div className="winput" style={{ width: 180, padding: "6px 10px" }}><span className="ico">⌕</span>Search…</div>
      <div className="wbtn wbtn--sm">▦ This quarter ▾</div>
      <div className="status">🔔 3</div>
      <div className="chip chip--solid"><span className="sq" />CFO</div>
    </div>
  );
}

/* panel */
function Panel({ title, action, children, style }) {
  return (
    <div className="wpanel" style={style}>
      {(title || action) && (
        <div className="wpanel__hd">
          {title && <div className="wpanel__t">{title}</div>}
          <div className="wpanel__spacer" />
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* bar chart */
function Bars({ data = [40, 65, 50, 80, 60, 95], hi = 3, labels }) {
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={i} className={"bar" + (i === hi ? " is-hi" : "")} style={{ height: d + "%" }}>
          {labels && <span>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

/* KPI stat */
function Stat({ label, value, sub, n }) {
  return (
    <div className="wpanel" style={{ padding: 14 }}>
      <div className="wlabel">{label}{n && <B n={n} />}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 2px", color: "var(--ink)" }}>{value}</div>
      {sub && <div className="fs12 muted">{sub}</div>}
    </div>
  );
}

Object.assign(window, {
  TLine, TLines, Ph, WLabel, B, Notes, Spec, Frame, Shell, TopBits, Panel, Bars, Stat, NAV,
});
