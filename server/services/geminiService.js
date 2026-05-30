const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) return null;
    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
}

function fallbackParse(message) {
  const lower = String(message || '').toLowerCase();

  let intent = 'total_spend';
  if (lower.includes('compare')) intent = 'compare_spend';
  if (lower.includes('largest') || lower.includes('biggest')) intent = 'top_transactions';
  if (lower.includes('top merchant') || lower.includes('merchant')) intent = 'top_merchants';
  if (lower.includes('trend') || lower.includes('over time')) intent = 'spend_trend';

  const categories = ['Fuel', 'Travel', 'Meals', 'Software', 'Government / Permits', 'Alcohol / Bar'];
  const departments = ['Operations', 'Logistics', 'Finance', 'Sales'];

  const category = categories.find(c => lower.includes(c.toLowerCase())) || null;
  const department = departments.find(d => lower.includes(d.toLowerCase())) || null;

  let groupBy = null;
  if (lower.includes('by merchant')) groupBy = 'merchant';
  else if (lower.includes('by category')) groupBy = 'category';
  else if (lower.includes('by country')) groupBy = 'country';
  else if (lower.includes('by state')) groupBy = 'stateProvince';
  else if (lower.includes('over time')) groupBy = 'month';

  let dateRange = null;
  if (lower.includes('last quarter')) {
    dateRange = { type: 'relative', value: 'last_quarter' };
  } else if (lower.includes('this month')) {
    dateRange = { type: 'relative', value: 'this_month' };
  } else if (lower.includes('last month')) {
    dateRange = { type: 'relative', value: 'last_month' };
  }

  return {
    intent,
    category,
    merchant: null,
    department,
    employeeName: null,
    city: null,
    stateProvince: null,
    country: null,
    dateRange,
    groupBy,
    metric: 'total_spend',
    chartType: null,
  };
}

async function understandQuestion(message) {
  const prompt = [
    'Convert the finance question into strict JSON only.',
    'Return fields: intent, category, merchant, department, employeeName, city, stateProvince, country, dateRange, groupBy, metric, chartType.',
    'dateRange should be an object: {"type":"relative|absolute|null","value":"...","startDate":"YYYY-MM-DD|null","endDate":"YYYY-MM-DD|null"}',
    `Question: ${message}`,
  ].join('\n');

  const parsed = await callGemini(prompt);
  return parsed || fallbackParse(message);
}

async function resolveFollowUp(currentMessage, previousContext) {
  const prompt = [
    'Given previous context and current message, return a complete updated query JSON.',
    'Do not omit inherited fields. Return JSON only.',
    `previousContext: ${JSON.stringify(previousContext)}`,
    `currentMessage: ${currentMessage}`,
  ].join('\n');

  const parsed = await callGemini(prompt);
  if (parsed) return parsed;

  const fallback = fallbackParse(currentMessage);
  return {
    ...previousContext,
    ...fallback,
    intent: fallback.intent || previousContext?.intent || 'total_spend',
    category: fallback.category || previousContext?.category || null,
    department: fallback.department || previousContext?.department || null,
    dateRange: fallback.dateRange || previousContext?.dateRange || null,
    metric: previousContext?.metric || 'total_spend',
  };
}

async function summarizeCalculatedResult(question, result) {
  const prompt = [
    'Explain this computed result in plain business English in 1-3 sentences.',
    'Do not invent numbers. Use only values provided.',
    JSON.stringify({ question, result }),
  ].join('\n');

  const summary = await callGemini(prompt);
  if (summary && summary.summary) return summary.summary;

  if (result.total !== undefined) {
    return `Total spend is $${Number(result.total).toLocaleString()} for the selected filters.`;
  }
  if (Array.isArray(result.comparison)) {
    return result.comparison.map(x => `${x.name}: $${x.value.toLocaleString()}`).join('; ');
  }
  return 'The query was processed successfully.';
}

async function explainPolicyViolation(transaction, policyRule) {
  const prompt = [
    'Write a concise policy explanation for why this transaction was flagged.',
    'Use only provided facts, no invented details.',
    JSON.stringify({ transaction, policyRule }),
  ].join('\n');

  const explanation = await callGemini(prompt);
  if (explanation && explanation.explanation) return explanation.explanation;

  return `Flagged under policy rule \"${policyRule.name}\": ${policyRule.description}`;
}

async function recommendApproval(approvalInput) {
  const prompt = [
    'Return JSON only with keys: recommendation, confidence, reasoning.',
    'Recommendation must be one of Approve, Deny, Review.',
    JSON.stringify(approvalInput),
  ].join('\n');

  const rec = await callGemini(prompt);
  if (rec && rec.recommendation) return rec;

  const hasHighRisk = (approvalInput.policyIssues || []).some(issue => /high|restricted|split|missing/i.test(issue));
  if (hasHighRisk) {
    return {
      recommendation: 'Review',
      confidence: 'Medium',
      reasoning: 'Policy issues exist and require manual finance review before final approval.',
    };
  }

  return {
    recommendation: 'Approve',
    confidence: 'Low',
    reasoning: 'No critical policy blockers detected by fallback rules.',
  };
}

async function generateInsightCards(input) {
  const prompt = [
    'Generate 3-5 concise finance dashboard insight cards from this metrics object.',
    'Return JSON with key insights as array of strings.',
    JSON.stringify(input),
  ].join('\n');

  const res = await callGemini(prompt);
  if (res && Array.isArray(res.insights)) return res.insights;
  return ['Spend analysis is available based on current filtered data.'];
}

module.exports = {
  understandQuestion,
  resolveFollowUp,
  summarizeCalculatedResult,
  explainPolicyViolation,
  recommendApproval,
  generateInsightCards,
};
