"use client";

type RailItem = { k: string; n: string; label: string; href?: string };

const SECTIONS: { group: string; items: RailItem[] }[] = [
  {
    group: "Concept",
    items: [
      { k: "overview", n: "00", label: "Overview", href: "/#overview" },
      { k: "analysis", n: "01", label: "Product analysis", href: "/#analysis" },
      { k: "sitemap", n: "02", label: "Sitemap", href: "/#sitemap" },
      { k: "nav", n: "03", label: "Navigation", href: "/#nav" },
      { k: "journeys", n: "04", label: "User journeys", href: "/#journeys" },
    ],
  },
  {
    group: "Core screens",
    items: [
      { k: "auth", n: "05", label: "Login & sign-up", href: "/#auth" },
      { k: "onboarding", n: "06", label: "Onboarding", href: "/#onboarding" },
      { k: "dashboard", n: "07", label: "Dashboard", href: "/#dashboard" },
      { k: "ask", n: "08", label: "Talk to Your Data ★", href: "/#ask" },
    ],
  },
  {
    group: "Feature screens",
    items: [
      { k: "policy", n: "09", label: "Policy & violations", href: "/#policy" },
      { k: "approvals", n: "10", label: "Pre-approval", href: "/#approvals" },
      { k: "reports", n: "11", label: "Expense reports", href: "/#reports" },
      { k: "transactions", n: "12", label: "Transactions", href: "/#transactions" },
    ],
  },
  {
    group: "States",
    items: [
      { k: "notifications", n: "13", label: "Notifications", href: "/#notifications" },
      { k: "settings", n: "14", label: "Settings & admin", href: "/#settings" },
      { k: "empty", n: "15", label: "Empty states", href: "/#empty" },
      { k: "error", n: "16", label: "Error states", href: "/#error" },
    ],
  },
];

type AppRailProps = {
  /** Wireframe section key from location hash (home only) */
  activeKey?: string;
  /** Highlight Policy Engine on /compliance */
  complianceActive?: boolean;
};

export default function AppRail({ activeKey, complianceActive = false }: AppRailProps) {
  return (
    <div className="rail">
      <div className="rail__brand">
        <a href="/" className="rail__logo" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="rail__mark">B</div>
          <div className="rail__name">Brim</div>
        </a>
        <div className="rail__tag">Wireframe Concept</div>
      </div>
      <div className="rail__scroll">
        <div className="rail__group">
          <div className="rail__grouplabel">Live Feature</div>
          <a
            href="/compliance"
            className={
              "rail__link rail__link--live" + (complianceActive ? " is-active" : "")
            }
            style={{ textDecoration: "none" }}
          >
            <span className="rail__num">⚑</span>
            Policy Engine — Live
          </a>
        </div>
        {SECTIONS.map((g, gi) => (
          <div className="rail__group" key={gi}>
            <div className="rail__grouplabel">{g.group}</div>
            {g.items.map((it) => {
              const isActive = !complianceActive && it.k === activeKey;
              return (
                <a
                  key={it.k}
                  href={complianceActive ? `/#${it.k}` : `#${it.k}`}
                  className={"rail__link" + (isActive ? " is-active" : "")}
                  style={{ textDecoration: "none" }}
                >
                  <span className="rail__num">{it.n}</span>
                  {it.label}
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
