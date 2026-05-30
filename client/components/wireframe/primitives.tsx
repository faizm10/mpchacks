'use client';

import React from "react";

/* ---------- tiny atoms ---------- */
export function TLine({ w = "w80" }: { w?: string }) {
  return <span className={"tline " + w} />;
}
export function TLines({ lines = [["w90"], ["w70"]] }: { lines?: string[][] }) {
  return (
    <div>
      {lines.map((l, i) => (
        <TLine key={i} w={l[0]} />
      ))}
    </div>
  );
}
export function Ph({
  label,
  h = 80,
  style,
}: {
  label?: React.ReactNode;
  h?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div className="ph" style={{ height: h, ...style }}>
      <span>{label}</span>
    </div>
  );
}
export function WLabel({ children }: { children?: React.ReactNode }) {
  return <div className="wlabel">{children}</div>;
}

export function B({ n }: { n?: React.ReactNode }) {
  return <span className="badge">{n}</span>;
}

export function Notes({
  items,
  title = "Annotations",
}: {
  items: { n: React.ReactNode; t: string }[];
  title?: string;
}) {
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

export function Spec({
  no,
  title,
  sub,
  children,
  notes,
  rationale,
  wide,
}: {
  no?: React.ReactNode;
  title?: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  notes?: { n: React.ReactNode; t: string }[];
  rationale?: React.ReactNode;
  wide?: boolean;
}) {
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

export function Frame({
  url = "app.brim.finance",
  children,
}: {
  url?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="frame">
      <div className="frame__chrome">
        <div className="frame__dots">
          <i />
          <i />
          <i />
        </div>
        <div className="frame__url">{url}</div>
      </div>
      <div className="frame__body">{children}</div>
    </div>
  );
}

const NAV = [
  { k: "home", label: "Dashboard" },
  { k: "ask", label: "Ask Brim" },
  { k: "tx", label: "Transactions" },
  { k: "policy", label: "Policy" },
  { k: "approve", label: "Approvals" },
  { k: "reports", label: "Reports" },
];

export function Shell({
  active = "home",
  h = "Dashboard",
  top,
  children,
  minH = 540,
}: {
  active?: string;
  h?: React.ReactNode;
  top?: React.ReactNode;
  children?: React.ReactNode;
  minH?: number;
}) {
  return (
    <div className="ui" style={{ minHeight: minH }}>
      <div className="ui__side">
        <div className="ui__brand">
          <div className="ui__brandmark" />
          <div className="ui__brandname">Brim</div>
        </div>
        {NAV.map((n) => (
          <div key={n.k} className={"ui__nav" + (n.k === active ? " is-active" : "")}>
            <span className="dot" />
            {n.label}
          </div>
        ))}
        <div className="ui__navspacer" />
        <div className="ui__nav">
          <span className="dot" />
          Settings
        </div>
        <div className="ui__nav">
          <span className="dot" />
          Admin
        </div>
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

export function TopBits() {
  return (
    <div className="row center gap8">
      <div className="winput" style={{ width: 180, padding: "6px 10px" }}>
        <span className="ico">⌕</span>Search…
      </div>
      <div className="wbtn wbtn--sm">▦ This quarter ▾</div>
      <div className="status">🔔 3</div>
      <div className="chip chip--solid">
        <span className="sq" />
        CFO
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  style,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
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

export function Bars({
  data = [40, 65, 50, 80, 60, 95],
  hi = 3,
  labels,
}: {
  data?: number[];
  hi?: number;
  labels?: React.ReactNode[];
}) {
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div
          key={i}
          className={"bar" + (i === hi ? " is-hi" : "")}
          style={{ height: d + "%" }}
        >
          {labels && <span>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  n,
}: {
  label?: React.ReactNode;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  n?: React.ReactNode;
}) {
  return (
    <div className="wpanel" style={{ padding: 14 }}>
      <div className="wlabel">
        {label}
        {n && <B n={n} />}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 26,
          fontWeight: 700,
          margin: "6px 0 2px",
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
      {sub && <div className="fs12 muted">{sub}</div>}
    </div>
  );
}

export { NAV };
