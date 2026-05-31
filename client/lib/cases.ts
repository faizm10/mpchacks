"use client";

import { useCallback, useEffect, useState } from "react";

// ─── Case workflow grounded in the Brim Expense Policy ─────────────────────────
//
// Policy clauses that drive these actions:
//  • "All expenses over $50.00 must be pre-authorized by your manager and
//     receipts are required before any expense is reimbursed."
//  • "Names of guests and purpose must be listed with the receipts."
//  • "Brim may choose to restrict usage or revoke corporate cards where
//     consistent abuse of the policy is evident."
//  • Incidents should be reported to the Manager.

export type CaseStatus =
  | "open"
  | "info_requested"   // receipt / justification requested from cardholder
  | "escalated"        // sent to manager for pre-authorization / review
  | "flagged"          // flagged for finance review
  | "card_restricted"  // corporate card restricted (repeat abuse)
  | "dismissed";       // reviewed and cleared

export type CaseEvent = {
  status: CaseStatus;
  label: string;
  detail: string;
  actor: string;
  at: string; // ISO timestamp
};

export type CaseRecord = {
  txId: string;
  status: CaseStatus;
  events: CaseEvent[];
};

export const CASE_META: Record<
  CaseStatus,
  { label: string; color: string; verb: string }
> = {
  open: { label: "Open", color: "var(--status-low)", verb: "Reopened" },
  info_requested: { label: "Info Requested", color: "var(--status-medium)", verb: "Requested receipt & justification" },
  escalated: { label: "Escalated", color: "var(--accent)", verb: "Escalated to manager" },
  flagged: { label: "Flagged", color: "var(--status-high)", verb: "Flagged for finance review" },
  card_restricted: { label: "Card Restricted", color: "var(--status-critical)", verb: "Restricted corporate card" },
  dismissed: { label: "Dismissed", color: "var(--status-positive)", verb: "Dismissed as compliant" },
};

const STORAGE_KEY = "brim.cases.v1";
const ACTOR = "Finance Admin";

function load(): Record<string, CaseRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(map: Record<string, CaseRecord>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

export function useCases() {
  const [cases, setCases] = useState<Record<string, CaseRecord>>({});

  useEffect(() => {
    setCases(load());
  }, []);

  const applyAction = useCallback(
    (txId: string, status: CaseStatus, detail: string) => {
      setCases((prev) => {
        const meta = CASE_META[status];
        const existing = prev[txId];
        const event: CaseEvent = {
          status,
          label: meta.label,
          detail,
          actor: ACTOR,
          at: new Date().toISOString(),
        };
        const record: CaseRecord = {
          txId,
          status,
          events: [...(existing?.events ?? []), event],
        };
        const next = { ...prev, [txId]: record };
        save(next);
        return next;
      });
    },
    []
  );

  const getCase = useCallback((txId: string): CaseRecord | undefined => cases[txId], [cases]);

  const counts = useCallback(() => {
    const c = { open: 0, info_requested: 0, escalated: 0, flagged: 0, card_restricted: 0, dismissed: 0 };
    for (const rec of Object.values(cases)) c[rec.status] += 1;
    return c;
  }, [cases]);

  return { cases, getCase, applyAction, counts };
}

export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
