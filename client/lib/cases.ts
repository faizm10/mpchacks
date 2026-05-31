"use client";

import { useCallback, useSyncExternalStore } from "react";

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

type CaseMap = Record<string, CaseRecord>;

// ─── External store (localStorage) read through useSyncExternalStore ────────────
// This avoids the set-state-in-effect anti-pattern and keeps SSR consistent.

let memoryStore: CaseMap | null = null;
const listeners = new Set<() => void>();
const EMPTY: CaseMap = {};

function loadFromStorage(): CaseMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function getSnapshot(): CaseMap {
  if (memoryStore === null) memoryStore = loadFromStorage();
  return memoryStore;
}

function getServerSnapshot(): CaseMap {
  return EMPTY;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function commit(next: CaseMap) {
  memoryStore = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private mode */
    }
  }
  listeners.forEach((l) => l());
}

export function useCases() {
  const cases = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const applyAction = useCallback((txId: string, status: CaseStatus, detail: string) => {
    const prev = getSnapshot();
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
    commit({ ...prev, [txId]: record });
  }, []);

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
