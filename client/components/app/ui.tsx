"use client";

import { type ReactNode } from "react";

export function Card({
  title,
  sub,
  action,
  children,
  className,
  style,
}: {
  title?: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={"ux-card" + (className ? ` ${className}` : "")} style={style}>
      {(title || action) && (
        <div className="ux-card__hd">
          <div>
            {title && <div className="ux-card__title">{title}</div>}
            {sub && <div className="ux-card__sub">{sub}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="ux-card__body">{children}</div>
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent = "var(--accent)",
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="ux-kpi">
      <div className="ux-kpi__accent" style={{ background: accent }} />
      <div className="ux-kpi__label">{label}</div>
      <div className="ux-kpi__value">{value}</div>
      {sub && <div className="ux-kpi__sub">{sub}</div>}
    </div>
  );
}

export function BarChart({
  data,
  color = "var(--accent)",
  format,
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="ux-bars">
      {data.map((d, i) => (
        <div className="ux-bars__col" key={i}>
          {format && <span className="ux-bars__val">{format(d.value)}</span>}
          <div
            className="ux-bars__bar"
            style={{ height: `${(d.value / max) * 100}%`, background: d.color ?? color }}
          />
          <span className="ux-bars__lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({
  data,
  format,
}: {
  data: { name: string; value: number; color?: string }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="ux-hbars">
      {data.map((d, i) => (
        <div key={i}>
          <div className="ux-hbar__top">
            <span className="ux-hbar__name">{d.name}</span>
            <span className="ux-hbar__val">{format ? format(d.value) : d.value}</span>
          </div>
          <div className="ux-hbar__track">
            <div
              className="ux-hbar__fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? "var(--accent)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  data,
  centerLabel,
  centerValue,
  format,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
  format?: (n: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const stops = data
    .map((d, i) => {
      const prior = data.slice(0, i).reduce((s, x) => s + x.value, 0);
      const start = (prior / total) * 100;
      const end = ((prior + d.value) / total) * 100;
      return `${d.color} ${start}% ${end}%`;
    })
    .join(", ");
  return (
    <div className="ux-donut__wrap">
      <div className="ux-donut" style={{ background: `conic-gradient(${stops})` }}>
        <div className="ux-donut__center">
          <div>
            {centerValue && <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{centerValue}</div>}
            {centerLabel && <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{centerLabel}</div>}
          </div>
        </div>
      </div>
      <div className="ux-legend">
        {data.map((d, i) => (
          <div className="ux-legend__item" key={i}>
            <span className="ux-legend__dot" style={{ background: d.color }} />
            <span className="ux-legend__name">{d.name}</span>
            <span className="ux-legend__val">{format ? format(d.value) : d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({
  points,
  color = "var(--accent)",
  height = 160,
}: {
  points: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const w = 600;
  const h = height;
  const pad = { l: 8, r: 8, t: 12, b: 22 };
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = max - min || 1;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / Math.max(points.length - 1, 1)) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - min) / range) * innerH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z`;
  return (
    <svg className="ux-line" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="ux-line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ux-line-grad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="2.5" fill={color} />
      ))}
      {points.map((p, i) =>
        i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? (
          <text key={`t${i}`} x={x(i)} y={h - 6} fontSize="9" fill="var(--muted)" textAnchor="middle" fontFamily="var(--mono)">
            {p.label}
          </text>
        ) : null
      )}
    </svg>
  );
}

export function CatDot({ color }: { color: string }) {
  return <span className="ux-cat-dot" style={{ background: color }} />;
}
