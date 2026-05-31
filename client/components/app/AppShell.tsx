"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { type ReactNode } from "react";

type NavItem = { href: string; label: string; icon: string; badge?: number; live?: boolean };
type NavGroup = { group: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    group: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: "◳" },
      { href: "/transactions", label: "Transactions", icon: "≣" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { href: "/compliance", label: "Policy Engine", icon: "⚑", live: true },
      { href: "/ask", label: "Ask Brim", icon: "✦" },
    ],
  },
  {
    group: "Workflow",
    items: [
      { href: "/approvals", label: "Approvals", icon: "◷" },
      { href: "/reports", label: "Expense Reports", icon: "▤" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/notifications", label: "Notifications", icon: "◔" },
      { href: "/settings", label: "Settings", icon: "⚙" },
    ],
  },
];

export default function AppShell({
  title,
  subtitle,
  kicker,
  actions,
  children,
  fullBleed,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  kicker?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  fullBleed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="appx">
      <nav className="appx-nav">
        <Link href="/" className="appx-nav__brand">
          <span className="appx-nav__mark">B</span>
          <span className="appx-nav__name">Brim</span>
          <span className="appx-nav__env">Fleet</span>
        </Link>
        <div className="appx-nav__scroll">
          {NAV.map((g) => (
            <div className="appx-nav__group" key={g.group}>
              <div className="appx-nav__grouplabel">{g.group}</div>
              {g.items.map((it) => {
                const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={"appx-nav__link" + (active ? " is-active" : "")}
                  >
                    <span className="appx-nav__icon">{it.icon}</span>
                    <span className="appx-nav__label">{it.label}</span>
                    {it.live && <span className="appx-nav__live">LIVE</span>}
                    {it.badge ? <span className="appx-nav__badge">{it.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="appx-nav__foot">
          <div className="appx-nav__user">
            <span className="appx-nav__avatar">CFO</span>
            <div className="appx-nav__userinfo">
              <div className="appx-nav__username">Finance Admin</div>
              <div className="appx-nav__userrole">Brim Logistics</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="appx-main">
        {(title || actions) && (
          <header className="appx-header">
            <div>
              {kicker && <div className="appx-kicker">{kicker}</div>}
              {title && <h1 className="appx-title">{title}</h1>}
              {subtitle && <p className="appx-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="appx-header__actions">{actions}</div>}
          </header>
        )}
        <div className={"appx-body" + (fullBleed ? " appx-body--full" : "")}>{children}</div>
      </main>
    </div>
  );
}
