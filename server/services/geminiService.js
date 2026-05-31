const { GoogleGenAI } = require('@google/genai');
const { categoryAliases } = require('./queryCanonicalizer');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const LOG_PREFIX = '[ask:gemini]';

let aiClient = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
}

function extractText(response) {
  if (!response) return null;
  if (typeof response.text === 'string') return response.text;
  if (typeof response.text === 'function') return response.text();
  return response?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function isOutOfScopeQuestion(lower) {
  const asksExternalPrice = /\b(price|prices|rate|rates|cost per|per gallon|per litre|per liter)\b/.test(lower);
  const mentionsFuel = /\b(gas|fuel|diesel|petrol)\b/.test(lower);
  const asksInternalSpend = /\b(spend|spent|spending|transaction|transactions|expense|expenses|merchant|merchants|category|categories|compliance|violation|violations)\b/.test(lower);

  return asksExternalPrice && mentionsFuel && !asksInternalSpend;
}

function normalizeCategoryFromText(lower) {
  const hasTerm = term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  };

  const match = Object.entries(categoryAliases).find(([alias]) => hasTerm(alias.replace(/_/g, ' ')));
  return match?.[1] || null;
}

function normalizeParsedQuery(query, message) {
  const lower = String(message || '').toLowerCase();
  const normalized = {
    intent: query?.intent || 'total_spend',
    category: query?.category || null,
    merchant: query?.merchant || null,
    department: query?.department || null,
    employeeName: query?.employeeName || null,
    city: query?.city || null,
    stateProvince: query?.stateProvince || null,
    country: query?.country || null,
    dateRange: query?.dateRange || null,
    groupBy: query?.groupBy || null,
    metric: query?.metric || 'total_spend',
    chartType: query?.chartType || null,
    compareValues: query?.compareValues || null,
  };

  if (isOutOfScopeQuestion(lower)) {
    normalized.intent = 'out_of_scope';
    normalized.metric = 'out_of_scope';
  }

  const categoryFromText = normalizeCategoryFromText(lower);
  if (categoryFromText) normalized.category = categoryFromText;

  if (lower.includes('last month')) {
    normalized.dateRange = { type: 'relative', value: 'last_month' };
  } else if (lower.includes('this month')) {
    normalized.dateRange = { type: 'relative', value: 'this_month' };
  } else if (lower.includes('last quarter')) {
    normalized.dateRange = { type: 'relative', value: 'last_quarter' };
  }

  if (normalized.intent === 'small_talk') normalized.metric = 'small_talk';
  if (normalized.intent === 'out_of_scope') normalized.metric = 'out_of_scope';

  return normalized;
}

async function callGemini(prompt, label = 'unknown') {
  const ai = getAiClient();
  console.info(LOG_PREFIX, 'call start', { label, model: GEMINI_MODEL, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
  if (!ai) {
    console.warn(LOG_PREFIX, 'skipping Gemini call because GEMINI_API_KEY is not set', { label });
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        topP: 0.9
      },
    });

    const text = await extractText(response);
    console.info(LOG_PREFIX, 'raw response text', { label, text });
    if (!text) {
      console.warn(LOG_PREFIX, 'Gemini response had no text', { label });
      return null;
    }

    const parsed = JSON.parse(text);
    console.info(LOG_PREFIX, 'JSON parse success', { label, parsed });
    return parsed;
  } catch (err) {
    console.error(LOG_PREFIX, 'Gemini call or JSON parse failed', { label, error: err.message });
    return null;
  }
}

function fallbackParse(message) {
  const lower = String(message || '').toLowerCase();
  const normalizedMessage = lower.replace(/[^\w\s]/g, '').trim();
  const smallTalkPatterns = [
    /^(hello|hi|hey)$/,
    /^how are you( doing)?$/,
    /^good (morning|afternoon|evening)$/,
    /^(thanks|thank you)$/,
    /^what can you do$/,
    /^help$/,
  ];
  const isSmallTalk = smallTalkPatterns.some(pattern => pattern.test(normalizedMessage));

  const isPredictive = /\b(next month|next quarter|next year|forecast|predict|projection|will we spend|will i spend|will spend|going to spend|expected spend|how much will)\b/.test(lower);

  let intent = 'total_spend';
  if (isOutOfScopeQuestion(lower)) {
    intent = 'out_of_scope';
  } else if (isSmallTalk) {
    intent = 'small_talk';
  } else if (isPredictive) {
    intent = 'predict_spend';
  } else if (lower.includes('compare')) {
    intent = 'compare_spend';
  } else if (lower.includes('largest') || lower.includes('biggest')) {
    intent = 'top_transactions';
  } else if (lower.includes('top merchant') || lower.includes('merchant')) {
    intent = 'top_merchants';
  } else if (lower.includes('trend') || lower.includes('over time')) {
    intent = 'spend_trend';
  }

  const departments = ['Operations', 'Logistics', 'Sales', 'Marketing', 'Finance', 'Engineering'];

  const category = normalizeCategoryFromText(lower);
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
    metric: intent === 'small_talk' || intent === 'out_of_scope' ? intent : intent === 'predict_spend' ? 'predict_spend' : 'total_spend',
    chartType: null,
  };
}

async function understandQuestion(message) {
  const prompt = [
    'Convert the user message into strict JSON only.',
    'Return fields: intent, category, merchant, department, employeeName, city, stateProvince, country, dateRange, groupBy, metric, chartType.',
    'Allowed intents: small_talk, out_of_scope, total_spend, compare_spend, top_transactions, top_merchants, spend_trend, predict_spend.',
    'Use predict_spend for any forward-looking questions asking about future spend, next month spend, forecasts, or predictions.',
    'Use out_of_scope for external market questions such as current gas prices. Use total_spend for internal spend questions such as "what did we spend on gas".',
    'Map gas, gasoline, diesel, and petrol to category "Fuel".',
    'Map office supplies to category "Equipment" because Office Supplies is not a dataset category.',
    'dateRange should be an object: {"type":"relative|absolute|null","value":"...","startDate":"YYYY-MM-DD|null","endDate":"YYYY-MM-DD|null"}',
    `Question: ${message}`,
  ].join('\n');

  const parsed = await callGemini(prompt, 'understandQuestion');
  const query = parsed || fallbackParse(message);
  const normalized = normalizeParsedQuery(query, message);
  console.info(LOG_PREFIX, 'structured query returned', {
    source: parsed ? 'gemini' : 'fallback',
    query: normalized,
  });
  return normalized;
}

async function resolveFollowUp(currentMessage, previousContext) {
  const prompt = [
    'Given previous context and current message, return a complete updated query JSON.',
    'Do not omit inherited fields. Return JSON only.',
    `previousContext: ${JSON.stringify(previousContext)}`,
    `currentMessage: ${currentMessage}`,
  ].join('\n');

  const parsed = await callGemini(prompt, 'resolveFollowUp');
  if (parsed) return normalizeParsedQuery(parsed, currentMessage);

  const fallback = fallbackParse(currentMessage);
  return normalizeParsedQuery({
    ...previousContext,
    ...fallback,
    intent: fallback.intent || previousContext?.intent || 'total_spend',
    category: fallback.category || previousContext?.category || null,
    department: fallback.department || previousContext?.department || null,
    dateRange: fallback.dateRange || previousContext?.dateRange || null,
    metric: previousContext?.metric || 'total_spend',
  }, currentMessage);
}

async function summarizeCalculatedResult(question, result) {
  const prompt = [
    'Explain this computed result in plain business English in 1-3 sentences.',
    'Do not invent numbers. Use only values provided.',
    JSON.stringify({ question, result }),
  ].join('\n');

  const summary = await callGemini(prompt, 'summarizeCalculatedResult');
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
