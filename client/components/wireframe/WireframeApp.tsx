"use client";

import { useEffect, useState } from "react";
import {
  SecOverview,
  SecAnalysis,
  SecSitemap,
  SecNav,
  SecJourneys,
} from "./doc-sections";
import {
  SecAuth,
  SecOnboarding,
  SecDashboard,
  SecAsk,
} from "./screens-core";
import {
  SecPolicy,
  SecApprovals,
  SecReports,
  SecTransactions,
} from "./screens-features";
import {
  SecNotifications,
  SecSettings,
  SecEmpty,
  SecError,
} from "./screens-states";
import AppRail from "./AppRail";
import { Button } from "@/components/ui/button";

type SectionItem = {
  k: string;
  n: string;
  label: string;
  C: () => React.JSX.Element;
};

const SECTIONS: { group: string; items: SectionItem[] }[] = [
  {
    group: "Concept",
    items: [
      { k: "overview", n: "00", label: "Overview", C: SecOverview },
      { k: "analysis", n: "01", label: "Product analysis", C: SecAnalysis },
      { k: "sitemap", n: "02", label: "Sitemap", C: SecSitemap },
      { k: "nav", n: "03", label: "Navigation", C: SecNav },
      { k: "journeys", n: "04", label: "User journeys", C: SecJourneys },
    ],
  },
  {
    group: "Core screens",
    items: [
      { k: "auth", n: "05", label: "Login & sign-up", C: SecAuth },
      { k: "onboarding", n: "06", label: "Onboarding", C: SecOnboarding },
      { k: "dashboard", n: "07", label: "Dashboard", C: SecDashboard },
      { k: "ask", n: "08", label: "Talk to Your Data ★", C: SecAsk },
    ],
  },
  {
    group: "Feature screens",
    items: [
      { k: "policy", n: "09", label: "Policy & violations", C: SecPolicy },
      { k: "approvals", n: "10", label: "Pre-approval", C: SecApprovals },
      { k: "reports", n: "11", label: "Expense reports", C: SecReports },
      { k: "transactions", n: "12", label: "Transactions", C: SecTransactions },
    ],
  },
  {
    group: "States",
    items: [
      { k: "notifications", n: "13", label: "Notifications", C: SecNotifications },
      { k: "settings", n: "14", label: "Settings & admin", C: SecSettings },
      { k: "empty", n: "15", label: "Empty states", C: SecEmpty },
      { k: "error", n: "16", label: "Error states", C: SecError },
    ],
  },
];

const FLAT = SECTIONS.flatMap((g) => g.items);

export default function WireframeApp() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const hash = (window.location.hash || "#overview").slice(1);
    setActive(hash);
    const onHash = () => setActive((window.location.hash || "#overview").slice(1));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.querySelector(".stage")?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [active]);

  const cur = FLAT.find((s) => s.k === active) ?? FLAT[0];
  const idx = FLAT.indexOf(cur);
  const go = (k: string) => {
    window.location.hash = k;
    setActive(k);
  };
  const C = cur.C;

  return (
    <div className="app">
      <AppRail activeKey={active} />

      <div className="stage">
        <div className="stage__inner">
          <C />
          <div
            className="row between center"
            style={{
              marginTop: 56,
              paddingTop: 22,
              borderTop: "1px solid var(--line)",
            }}
          >
            {idx > 0 ? (
              <Button type="button" className="wbtn" onClick={() => go(FLAT[idx - 1].k)}>
                ← {FLAT[idx - 1].label}
              </Button>
            ) : (
              <span />
            )}
            <span className="fs12 muted mono">
              {cur.n} / 16
            </span>
            {idx < FLAT.length - 1 ? (
              <Button type="button" className="wbtn wbtn--p" onClick={() => go(FLAT[idx + 1].k)}>
                {FLAT[idx + 1].label} →
              </Button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
