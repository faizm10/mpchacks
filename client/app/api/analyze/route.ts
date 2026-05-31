import { NextRequest } from "next/server";
import type { ComplianceResult } from "@/lib/compliance";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result: ComplianceResult = body.result;

  const tx = result.tx;
  const violations = result.violations;

  try {
    const severityRank: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
    const topSeverity = [...violations]
      .sort((a, b) => (severityRank[b.severity] ?? -1) - (severityRank[a.severity] ?? -1))[0]?.severity;

    const reasonPreview = violations.slice(0, 2).map((v) => v.reason).join(" ");
    const total = Number(tx.amount || 0).toFixed(2);
    const count = violations.length;

    const reasoning =
      count === 0
        ? `No policy violations were detected for this $${total} ${result.mccLabel.toLowerCase()} transaction at ${tx.merchant}. This looks compliant based on the current rule set.`
        : `${count} policy issue${count > 1 ? "s were" : " was"} flagged on this $${total} transaction at ${tx.merchant}${topSeverity ? ` (${topSeverity} severity)` : ""}. ${reasonPreview} Recommended action: ${count > 1 || topSeverity === "critical" || topSeverity === "high" ? "escalate for manager review before approval." : "request clarification and receipt details before approval."}`;

    return Response.json({ reasoning });
  } catch (err) {
    console.error("Analyze API error:", err);
    return Response.json({ reasoning: null }, { status: 500 });
  }
}
