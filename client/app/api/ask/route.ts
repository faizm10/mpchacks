import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import {
  dashboardKpis,
  monthlySpend,
  categoryBreakdown,
  topMerchants,
  fleetBreakdown,
  fmtMoney,
} from "@/lib/analytics";

const client = new Anthropic();

function buildDataContext(): string {
  const k = dashboardKpis();
  const monthly = monthlySpend();
  const cats = categoryBreakdown();
  const merchants = topMerchants(15);
  const fleets = fleetBreakdown();

  return `FLEET SPEND DATA SUMMARY (Brim Logistics — trucking/fleet company)

Overview:
- Total spend: ${fmtMoney(k.totalSpend)} across ${k.txCount} transactions
- Date range: ${k.dateRange.start} to ${k.dateRange.end}
- Average transaction: ${fmtMoney(k.avgTx)}
- Flagged transactions: ${k.flaggedCount} (${fmtMoney(k.flaggedValue)} at risk), ${k.criticalCount} critical
- Compliance rate: ${(k.complianceRate * 100).toFixed(1)}%
- ${k.fleetCount} fleet units, ${k.countries} countries

Monthly spend:
${monthly.map((m) => `- ${m.label}: ${fmtMoney(m.total)} (${m.count} tx)`).join("\n")}

Spend by category:
${cats.map((c) => `- ${c.category}: ${fmtMoney(c.total)} (${c.count} tx)`).join("\n")}

Top merchants:
${merchants.map((m) => `- ${m.merchant} [${m.category}]: ${fmtMoney(m.total)} (${m.count} tx)`).join("\n")}

Spend by fleet unit:
${fleets.map((f) => `- ${f.name}: ${fmtMoney(f.total)} (${f.count} tx, ${f.flagged} flagged)`).join("\n")}`;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const system = `You are Brim, an AI financial analyst for a fleet/trucking company's expense data. Answer questions about the company's spending in plain English, using the data provided below. Be concise and specific — cite real numbers from the data. When relevant, mention compliance/policy concerns. If asked something the data can't answer, say so briefly.

${buildDataContext()}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return Response.json({ reply: text });
  } catch (err) {
    console.error("Ask API error:", err);
    return Response.json({ reply: null }, { status: 500 });
  }
}
