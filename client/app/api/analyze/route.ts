import { NextRequest } from "next/server";
import type { ComplianceResult } from "@/lib/compliance";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

type AnalyzeBody = {
  result: ComplianceResult;
  cardMonthlyHistory?: { month: string; spend: number }[];
  remainingBudget?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeBody;

    if (!body?.result?.tx) {
      return Response.json({ reasoning: null, riskScore: null, error: "Missing result payload" }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/compliance/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return Response.json(
        {
          reasoning: null,
          riskScore: null,
          error: data?.error || "Compliance analysis request failed.",
        },
        { status: backendRes.status }
      );
    }

    return Response.json({
      reasoning: data?.reasoning ?? null,
      riskScore: typeof data?.riskScore === "number" ? data.riskScore : null,
      riskLevel: data?.riskLevel ?? null,
      mlBreakdown: data?.mlBreakdown ?? null,
    });
  } catch (err) {
    console.error("Analyze API proxy error:", err);
    return Response.json({ reasoning: null, riskScore: null }, { status: 500 });
  }
}
