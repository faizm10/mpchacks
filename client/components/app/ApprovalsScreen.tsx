"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppShell from "@/components/app/AppShell";
import { Card } from "@/components/app/ui";
import { buildApprovalContext, formatBudgetLine, waitingHoursFor } from "@/lib/approvalContext";
import {
  categoryOf,
  complianceResults,
  fleetName,
  fmtMoney,
  MCC_LABELS,
} from "@/lib/analytics";
import type { ComplianceResult } from "@/lib/compliance";
import { useCases } from "@/lib/cases";

type DecisionKind = "approved" | "denied" | "info_requested" | "changes_requested";

type DecisionRecord = {
  txId: string;
  kind: DecisionKind;
  note: string;
  at: string;
  approver: string;
};

const APPROVER = "Fleet Manager";
const STORAGE_KEY = "brim-approval-decisions-v1";
const QUEUE_PREVIEW_LIMIT = 80;

function loadDecisions(): Record<string, DecisionRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DecisionRecord>) : {};
  } catch {
    return {};
  }
}

function saveDecisions(map: Record<string, DecisionRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function quickRecommendation(result: ComplianceResult): { action: "Approve" | "Review" | "Deny" } {
  const { tx, status } = result;
  if (status === "critical" && tx.amount > 25000) return { action: "Deny" };
  if (status === "critical" || tx.amount > 25000) return { action: "Review" };
  if (status === "flagged" || tx.amount > 5000) return { action: "Review" };
  return { action: "Approve" };
}

function recommendation(result: ComplianceResult): { action: "Approve" | "Review" | "Deny"; reason: string } {
  const { tx, status, violations } = result;
  const amount = tx.amount;
  const ctx = buildApprovalContext(result);
  const missingRequired = ctx.docs.filter((d) => d.required && !d.satisfied);

  if (status === "critical" && missingRequired.length >= 2) {
    return {
      action: "Deny",
      reason: "Multiple policy gaps and critical risk score. Request documentation or deny until pre-auth and receipt are on file.",
    };
  }
  if (status === "critical" || amount > 25000) {
    return {
      action: "Review",
      reason: "High-value or critical-flagged charge. Confirm budget impact, documentation, and fleet spend pattern before approving.",
    };
  }
  if (missingRequired.length > 0) {
    return {
      action: "Review",
      reason: `Missing ${missingRequired.map((d) => d.label.toLowerCase()).join(", ")}. Approve only if you accept the documented exception.`,
    };
  }
  if (ctx.budget.requestPctOfRemaining > 40) {
    return {
      action: "Review",
      reason: `Uses ${ctx.budget.requestPctOfRemaining.toFixed(0)}% of remaining monthly budget for this fleet unit.`,
    };
  }
  return {
    action: "Approve",
    reason: "Operational expense consistent with fleet activity. Documentation and policy checks are satisfied.",
  };
}

function decisionLabel(kind: DecisionKind): string {
  switch (kind) {
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    case "info_requested":
      return "Info requested";
    case "changes_requested":
      return "Changes requested";
  }
}

export function ApprovalsScreen() {
  const { applyAction } = useCases();
  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>(loadDecisions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [pendingKind, setPendingKind] = useState<DecisionKind | null>(null);

  const pending = useMemo(
    () =>
      complianceResults()
        .filter((r) => r.tx.amount > 50 && r.status !== "clear" && !decisions[r.tx.id])
        .sort((a, b) => b.tx.amount - a.tx.amount),
    [decisions],
  );

  const pendingPreview = useMemo(
    () => pending.slice(0, QUEUE_PREVIEW_LIMIT),
    [pending],
  );

  const queueSummaries = useMemo(
    () =>
      pendingPreview.map((r) => ({
        id: r.tx.id,
        rec: quickRecommendation(r),
        waitingHours: waitingHoursFor(r.tx.txDate),
      })),
    [pendingPreview],
  );

  const summaryById = useMemo(() => {
    const map = new Map<string, (typeof queueSummaries)[number]>();
    for (const item of queueSummaries) map.set(item.id, item);
    return map;
  }, [queueSummaries]);

  useEffect(() => {
    if (pending.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !pending.some((r) => r.tx.id === selectedId)) {
      setSelectedId(pending[0].tx.id);
    }
  }, [pending, selectedId]);

  const selected = pending.find((r) => r.tx.id === selectedId) ?? pending[0] ?? null;

  const ctx = selected ? buildApprovalContext(selected) : null;
  const rec = selected ? recommendation(selected) : null;

  const requiredDocIds = useMemo(
    () => (ctx?.docs.filter((d) => d.required) ?? []).map((d) => d.id),
    [ctx],
  );

  const checklistComplete = useMemo(() => {
    if (!requiredDocIds.length) return true;
    return requiredDocIds.every((id) => checkedDocs[id]);
  }, [requiredDocIds, checkedDocs]);

  const resetForm = useCallback(() => {
    setNote("");
    setCheckedDocs({});
    setConfirmApprove(false);
    setPendingKind(null);
  }, []);

  const selectItem = useCallback(
    (id: string) => {
      setSelectedId(id);
      resetForm();
    },
    [resetForm],
  );

  const recordDecision = useCallback(
    (kind: DecisionKind) => {
      if (!selected) return;
      const record: DecisionRecord = {
        txId: selected.tx.id,
        kind,
        note: note.trim(),
        at: new Date().toISOString(),
        approver: APPROVER,
      };
      const approvedId = selected.tx.id;
      const amount = fmtMoney(selected.tx.amount);
      const merchant = selected.tx.merchant;

      setDecisions((prev) => {
        const next = { ...prev, [approvedId]: record };
        saveDecisions(next);
        return next;
      });

      if (kind === "info_requested") {
        applyAction(selected.tx.id, "info_requested", note.trim() || "Documentation requested from cardholder.");
      } else if (kind === "changes_requested") {
        applyAction(selected.tx.id, "info_requested", note.trim() || "Approver requested changes before approval.");
      }

      if (kind === "approved") {
        toast.success("Approved", { description: `${merchant} · ${amount} — employee notified.` });
      } else if (kind === "denied") {
        toast.error("Denied", { description: `${merchant} · ${amount} — cardholder notified with your note.` });
      } else if (kind === "info_requested") {
        toast("Info requested", { description: `${merchant} — cardholder will upload missing documentation.` });
      } else {
        toast("Changes requested", { description: `${merchant} — sent back for revision.` });
      }

      resetForm();
      setSelectedId((currentId) => {
        const nextPending = pending.filter((r) => r.tx.id !== approvedId);
        if (nextPending.some((r) => r.tx.id === currentId)) return currentId;
        return nextPending[0]?.tx.id ?? null;
      });
    },
    [selected, note, applyAction, pending, resetForm],
  );

  const tryDecision = (kind: DecisionKind) => {
    if (!selected || !rec) return;

    if (kind === "denied" && note.trim().length < 10) {
      toast.error("Add a denial reason", { description: "Policy requires at least 10 characters explaining the decision." });
      return;
    }

    if (kind === "approved") {
      if (!checklistComplete) {
        toast.error("Complete the review checklist", {
          description: "Confirm you reviewed each required policy item before approving.",
        });
        return;
      }
      const needsNote = selected.tx.amount > 5000 || selected.status === "critical";
      if (needsNote && note.trim().length < 5) {
        toast.error("Add an approval note", {
          description: "High-value approvals need a short note for the audit trail.",
        });
        return;
      }
      if (selected.tx.amount > 1000 || selected.status === "critical") {
        setPendingKind("approved");
        setConfirmApprove(true);
        return;
      }
    }

    recordDecision(kind);
  };

  const confirmAndRecord = () => {
    if (pendingKind) recordDecision(pendingKind);
    setConfirmApprove(false);
    setPendingKind(null);
  };

  return (
    <AppShell
      kicker="Workflow · Decisions"
      title="Pre-Approval Queue"
      subtitle="Review spend history, budget impact, and policy documentation — then decide once with a recorded note."
      actions={<span className="ux-pill ux-pill--accent">{pending.length} pending</span>}
    >
      <div className="ux-approv">
        <Card
          title="Awaiting decision"
          sub={
            pending.length > QUEUE_PREVIEW_LIMIT
              ? `Showing ${pendingPreview.length} of ${pending.length} · highest value first`
              : `${pending.length} requests`
          }
          className="ux-approv__queue"
        >
          <div className="ux-approv__list">
            {pending.length === 0 ? (
              <p className="ux-muted" style={{ padding: 16 }}>
                No pending approvals — flagged charges over $50 appear here until decided.
              </p>
            ) : (
              pendingPreview.map((r) => {
                const meta = summaryById.get(r.tx.id);
                const recItem = meta?.rec ?? quickRecommendation(r);
                const active = selected?.tx.id === r.tx.id;
                const waitingHours = meta?.waitingHours ?? waitingHoursFor(r.tx.txDate);
                return (
                  <button
                    key={r.tx.id}
                    type="button"
                    className={"ux-approv__item" + (active ? " is-active" : "")}
                    onClick={() => selectItem(r.tx.id)}
                  >
                    <div className="ux-approv__item-main">
                      <div className="ux-approv__item-title">{r.tx.merchant}</div>
                      <div className="ux-approv__item-meta">
                        {fleetName(r.tx.cardCode)} · {r.tx.txDate}
                        {waitingHours >= 24 && (
                          <span className="ux-approv__sla"> · {waitingHours}h waiting</span>
                        )}
                      </div>
                    </div>
                    <div className="ux-approv__item-side">
                      <div className="ux-approv__item-amt">{fmtMoney(r.tx.amount)}</div>
                      <span
                        className={
                          "ux-approv__rec ux-approv__rec--" + recItem.action.toLowerCase()
                        }
                      >
                        {recItem.action}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {selected && ctx && rec ? (
          <div className="ux-approv__detail">
            <Card className="ux-approv__hero">
              <div className="ux-approv__hero-top">
                <div>
                  <h2 className="ux-approv__merchant">{selected.tx.merchant}</h2>
                  <p className="ux-approv__loc">
                    {MCC_LABELS[selected.tx.mcc] ?? "Other"} · {selected.tx.city}, {selected.tx.state}
                  </p>
                </div>
                <div className="ux-approv__hero-amt">{fmtMoney(selected.tx.amount)}</div>
              </div>
              <dl className="ux-approv__grid">
                <div>
                  <dt>Fleet unit</dt>
                  <dd>
                    {fleetName(selected.tx.cardCode)} · {selected.tx.cardCode}
                  </dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{selected.tx.txDate}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{categoryOf(selected.tx.mcc)}</dd>
                </div>
                <div>
                  <dt>Waiting</dt>
                  <dd>{ctx.waitingHours}h</dd>
                </div>
              </dl>
              <div className="ux-approv__purpose">
                <span className="ux-approv__purpose-label">Stated purpose</span>
                <p>{ctx.businessPurpose}</p>
              </div>
            </Card>

            <div className="ux-approv__cols">
              <Card title="Fleet spend history" sub={`${fleetName(selected.tx.cardCode)} · YTD`}>
                <div className="ux-approv__chips">
                  <span className="ux-approv__chip">{ctx.fleet.ytdCount} transactions YTD</span>
                  <span className="ux-approv__chip">{fmtMoney(ctx.fleet.ytdTotal)} total</span>
                  <span className="ux-approv__chip">{ctx.fleet.flaggedYtd} prior flags</span>
                  <span className="ux-approv__chip">
                    Avg {fmtMoney(ctx.fleet.avgTxAmount)}
                  </span>
                </div>
                <p className="ux-approv__hist-line">
                  This month: {ctx.fleet.monthCount} charges · {fmtMoney(ctx.fleet.monthTotal)} ·{" "}
                  {categoryOf(selected.tx.mcc)}: {ctx.fleet.categoryCount} ({fmtMoney(ctx.fleet.categoryTotal)})
                </p>
                {ctx.fleet.recentSameCategory.length > 0 && (
                  <ul className="ux-approv__hist-list">
                    {ctx.fleet.recentSameCategory.map((h, i) => (
                      <li key={i}>
                        <span>{h.merchant}</span>
                        <span>{fmtMoney(h.amount)}</span>
                        <span className="ux-muted">{h.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Monthly budget" sub={ctx.budget.monthLabel}>
                <div className="ux-approv__budget-amt">{fmtMoney(ctx.budget.remaining)}</div>
                <p className="ux-muted">{formatBudgetLine(ctx.budget)} · {ctx.budget.pctUsed.toFixed(0)}% used</p>
                <div className="ux-approv__budget-bar">
                  <div
                    className="ux-approv__budget-fill"
                    style={{ width: `${Math.min(ctx.budget.pctUsed, 100)}%` }}
                  />
                </div>
                <p className="ux-approv__budget-impact">
                  This request → {ctx.budget.requestPctOfRemaining.toFixed(0)}% of remaining budget
                </p>
              </Card>
            </div>

            <Card title="Policy & documentation">
              {selected.violations.length > 0 && (
                <ul className="ux-approv__violations">
                  {selected.violations.map((v, i) => (
                    <li key={i}>
                      <span className={"ux-sev ux-sev--" + v.severity}>{v.severity.toUpperCase()}</span>
                      {v.reason}
                    </li>
                  ))}
                </ul>
              )}
              <p className="ux-approv__checklist-hd">Approver review checklist</p>
              <ul className="ux-approv__checklist">
                {ctx.docs.map((d) => (
                  <li key={d.id}>
                    <label className="ux-approv__check">
                      <input
                        type="checkbox"
                        checked={!!checkedDocs[d.id]}
                        onChange={(e) =>
                          setCheckedDocs((prev) => ({ ...prev, [d.id]: e.target.checked }))
                        }
                      />
                      <span>
                        <strong>{d.label}</strong>
                        {d.required && <em className="ux-approv__req">Required</em>}
                        {!d.satisfied && (
                          <span className="ux-approv__missing"> · Not on file</span>
                        )}
                        <span className="ux-approv__check-detail">{d.detail}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="ux-approv__rec-box">
              <div className="ux-approv__rec-label">AI recommendation</div>
              <div className={"ux-approv__rec-verdict ux-approv__rec--" + rec.action.toLowerCase()}>
                {rec.action}
              </div>
              <p>{rec.reason}</p>
            </div>

            <Card title="Your decision" sub="One action processes the request and notifies the cardholder">
              <textarea
                className="ux-approv__note"
                rows={3}
                placeholder={
                  rec.action === "Deny"
                    ? "Required: explain why this charge is denied…"
                    : selected.tx.amount > 5000
                      ? "Required for high-value approvals: brief audit note…"
                      : "Add a note for the audit trail (optional)…"
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="ux-approv__actions">
                <button type="button" className="ux-btn" onClick={() => tryDecision("info_requested")}>
                  Request info
                </button>
                <button type="button" className="ux-btn" onClick={() => tryDecision("changes_requested")}>
                  Request changes
                </button>
                <button type="button" className="ux-btn ux-btn--ghost" onClick={() => tryDecision("denied")}>
                  Deny
                </button>
                <button
                  type="button"
                  className="ux-btn ux-btn--primary ux-approv__approve-btn"
                  onClick={() => tryDecision("approved")}
                >
                  Approve {fmtMoney(selected.tx.amount)}
                </button>
              </div>
              {!checklistComplete && (
                <p className="ux-approv__hint">Check each required policy item above before approving.</p>
              )}
            </Card>
          </div>
        ) : (
          <Card title="Request detail" className="ux-approv__empty">
            <p className="ux-muted">Select a pending request to review context and decide.</p>
          </Card>
        )}
      </div>

      {confirmApprove && selected && (
        <div className="ux-approv__modal-backdrop" role="presentation" onClick={() => setConfirmApprove(false)}>
          <div
            className="ux-approv__modal"
            role="dialog"
            aria-labelledby="confirm-approve-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-approve-title">Confirm approval</h3>
            <p>
              You are approving <strong>{fmtMoney(selected.tx.amount)}</strong> at{" "}
              <strong>{selected.tx.merchant}</strong> for {fleetName(selected.tx.cardCode)}.
            </p>
            <ul className="ux-approv__modal-list">
              <li>Budget impact: {ctx?.budget.requestPctOfRemaining.toFixed(0)}% of remaining monthly budget</li>
              <li>Risk score: {selected.riskScore}</li>
              {note.trim() && <li>Your note: “{note.trim()}”</li>}
            </ul>
            <div className="ux-approv__modal-actions">
              <button type="button" className="ux-btn" onClick={() => setConfirmApprove(false)}>
                Go back
              </button>
              <button type="button" className="ux-btn ux-btn--primary" onClick={confirmAndRecord}>
                Confirm approval
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export { decisionLabel, type DecisionRecord };
