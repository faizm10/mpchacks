import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import type { ComplianceResult } from "@/lib/compliance";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result: ComplianceResult = body.result;

  const tx = result.tx;
  const violations = result.violations;

  const prompt = `You are a corporate expense compliance AI for Brim, a fleet/trucking company. Analyze this transaction and provide a concise 2-3 sentence AI context note.

Transaction:
- Merchant: ${tx.merchant}
- Amount: $${tx.amount.toFixed(2)}
- Category: ${result.mccLabel}
- Location: ${tx.city}, ${tx.state} ${tx.country}
- Date: ${tx.txDate}
- Card: ${tx.cardCode}

Detected policy issues:
${violations.map((v) => `- ${v.ruleTitle}: ${v.reason}`).join("\n") || "None"}

Policy context (Brim Expense Policy):
- Expenses over $50 need manager pre-authorization
- Alcohol only allowed when dining with customers (must list guest names)
- Tips capped at 15% (services) and 20% (meals)
- No personal expenses on corporate cards
- Car rental, parking, and gas receipts required
- Most cost-effective transportation required

Provide a SHORT, specific AI analysis (2-3 sentences max). Focus on:
1. Whether the flagged violations are likely legitimate or genuinely suspicious
2. Any contextual clues (fleet/trucking context — fuel, permits, tolls are normal)
3. Recommended action

Be direct and specific. Don't repeat the violation titles. Don't add headers.`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return Response.json({ reasoning: text });
  } catch (err) {
    console.error("Claude API error:", err);
    return Response.json({ reasoning: null }, { status: 500 });
  }
}
