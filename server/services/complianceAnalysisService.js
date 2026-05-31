const ml = require('../ml');
const { generateComplianceAnalysis } = require('./geminiService');

const SEVERITY_WEIGHT = {
  critical: 100,
  high: 60,
  medium: 30,
  low: 10,
};

const DEFAULT_CARD_MONTHLY_BUDGET = 20000;

function severityPolicyScore(violations) {
  if (!violations?.length) return 0;
  const raw = violations.reduce(
    (sum, v) => sum + (SEVERITY_WEIGHT[v.severity] || 0) * (v.confidence ?? 0.9),
    0
  );
  return Math.min(100, Math.round(raw / violations.length));
}

function computeRemainingBudget(cardMonthlyHistory, monthlyBudget = DEFAULT_CARD_MONTHLY_BUDGET) {
  if (!cardMonthlyHistory?.length) return monthlyBudget;
  const latest = cardMonthlyHistory[cardMonthlyHistory.length - 1];
  const spentThisMonth = Number(latest?.spend || 0);
  return Math.max(0, monthlyBudget - spentThisMonth);
}

function computeComplianceRiskScore({ tx, violations, cardMonthlyHistory, remainingBudget }) {
  if (!violations?.length) {
    return {
      riskScore: 0,
      riskLevel: 'low',
      mlBreakdown: { amountAnomaly: 0, budgetPressure: 0, policyRisk: 0 },
    };
  }

  const mlResult = ml.computeRiskScore({
    expenseAmount: Number(tx?.amount || 0),
    employeeMonthly: cardMonthlyHistory || [],
    remainingBudget: remainingBudget ?? computeRemainingBudget(cardMonthlyHistory),
    policyIssueCount: violations.length,
  });

  const policyScore = severityPolicyScore(violations);
  const blended = Math.round(mlResult.riskScore * 0.55 + policyScore * 0.45);
  const riskScore = Math.min(100, Math.max(0, blended));
  const riskLevel = riskScore >= 65 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

  return {
    riskScore,
    riskLevel,
    mlBreakdown: {
      ...mlResult.mlBreakdown,
      policySeverity: policyScore,
    },
  };
}

function buildFallbackReasoning({ tx, violations, mccLabel, riskScore }) {
  const total = Number(tx?.amount || 0).toFixed(2);
  const merchant = tx?.merchant || 'Unknown merchant';
  const category = (mccLabel || 'transaction').toLowerCase();
  const count = violations?.length || 0;

  if (count === 0) {
    return `No policy violations were detected for this $${total} ${category} transaction at ${merchant}. Risk score ${riskScore}/100 — this looks compliant based on the current rule set.`;
  }

  const severityRank = { critical: 3, high: 2, medium: 1, low: 0 };
  const topSeverity = [...violations]
    .sort((a, b) => (severityRank[b.severity] ?? -1) - (severityRank[a.severity] ?? -1))[0]?.severity;

  const reasonPreview = violations
    .slice(0, 2)
    .map((v) => v.reason)
    .join(' ');

  const action =
    count > 1 || topSeverity === 'critical' || topSeverity === 'high'
      ? 'escalate for manager review before approval.'
      : 'request clarification and receipt details before approval.';

  return `${count} policy issue${count > 1 ? 's were' : ' was'} flagged on this $${total} transaction at ${merchant}${topSeverity ? ` (${topSeverity} severity)` : ''}. Risk score ${riskScore}/100. ${reasonPreview} Recommended action: ${action}`;
}

async function analyzeComplianceResult(payload) {
  const { result, cardMonthlyHistory, remainingBudget } = payload || {};
  if (!result?.tx) {
    throw new Error('Missing compliance result payload');
  }

  const { tx, violations = [], mccLabel = '' } = result;
  const risk = computeComplianceRiskScore({
    tx,
    violations,
    cardMonthlyHistory,
    remainingBudget,
  });

  let reasoning = await generateComplianceAnalysis({
    transaction: tx,
    violations,
    mccLabel,
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
  });

  if (!reasoning) {
    reasoning = buildFallbackReasoning({ tx, violations, mccLabel, riskScore: risk.riskScore });
  }

  return {
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    reasoning,
    mlBreakdown: risk.mlBreakdown,
  };
}

module.exports = {
  analyzeComplianceResult,
  computeComplianceRiskScore,
};
