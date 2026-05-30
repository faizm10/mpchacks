const express = require('express');
const {
  understandQuestion,
  resolveFollowUp,
  summarizeCalculatedResult,
} = require('../services/geminiService');
const { getContext, setContext } = require('../services/conversationMemoryService');
const {
  filterTransactions,
  getTotalSpend,
  groupSpend,
  compareSpend,
  getTopMerchants,
  getTopTransactions,
  getSpendTrend,
} = require('../services/analyticsService');
const { validateChartType } = require('../services/chartService');
const { readJson } = require('../services/fileStore');

const router = express.Router();

function buildFollowUps(intent) {
  if (intent === 'compare_spend') {
    return [
      'Break that down by merchant',
      'Show the largest transactions',
      'Check these transactions for policy violations',
    ];
  }
  return [
    'Compare that to October',
    'Break that down by country',
    'Show the largest transactions',
    'Check these transactions for policy violations',
  ];
}

function extractFilters(query) {
  return {
    category: query.category || null,
    merchant: query.merchant || null,
    department: query.department || null,
    employeeName: query.employeeName || null,
    city: query.city || null,
    stateProvince: query.stateProvince || null,
    country: query.country || null,
    dateRange: query.dateRange?.value || query.dateRange || null,
  };
}

function calcResult(transactions, query) {
  const filters = extractFilters(query);

  if (query.intent === 'compare_spend') {
    if (query.country && Array.isArray(query.compareValues)) {
      return {
        metric: 'compare_spend',
        comparison: compareSpend(transactions, { ...filters, field: 'country', values: query.compareValues }),
      };
    }

    if (Array.isArray(query.compareValues)) {
      return {
        metric: 'compare_spend',
        comparison: query.compareValues.map(name => ({
          name,
          value: Number(getTotalSpend(transactions, { ...filters, department: name }).toFixed(2)),
        })),
      };
    }
  }

  if (query.intent === 'top_merchants') {
    return {
      metric: 'top_merchants',
      total: Number(getTotalSpend(transactions, filters).toFixed(2)),
      topMerchants: getTopMerchants(transactions, filters, 5),
    };
  }

  if (query.intent === 'top_transactions') {
    return {
      metric: 'top_transactions',
      total: Number(getTotalSpend(transactions, filters).toFixed(2)),
      topTransactions: getTopTransactions(transactions, filters, 10),
    };
  }

  if (query.intent === 'spend_trend') {
    return {
      metric: 'spend_trend',
      total: Number(getTotalSpend(transactions, filters).toFixed(2)),
      trend: getSpendTrend(transactions, filters),
    };
  }

  const grouped = query.groupBy ? groupSpend(transactions, query.groupBy, filters) : [];

  return {
    metric: 'total_spend',
    total: Number(getTotalSpend(transactions, filters).toFixed(2)),
    grouped,
    topMerchants: getTopMerchants(transactions, filters, 3),
  };
}

router.post('/ask', async (req, res) => {
  try {
    const { message, conversationId } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const transactions = readJson('data/transactions_enriched.json', []);
    const previous = getContext(conversationId);

    const lower = String(message).toLowerCase();
    const followupWords = ['that', 'those', 'it', 'them', 'compare'];
    const isLikelyFollowup = followupWords.some(w => lower.includes(w)) && previous?.lastContext;

    const query = isLikelyFollowup
      ? await resolveFollowUp(message, previous.lastContext)
      : await understandQuestion(message);

    const result = calcResult(transactions, query);

    const filters = extractFilters(query);
    const filtered = filterTransactions(transactions, filters);

    let chartData = [];
    if (result.comparison) chartData = result.comparison;
    else if (result.trend) chartData = result.trend;
    else if (result.grouped) chartData = result.grouped;
    else if (result.topMerchants) chartData = result.topMerchants.map(x => ({ name: x.name, value: x.value }));

    const tableData = getTopTransactions(filtered, {}, 10).map(row => ({
      date: row.date,
      merchant: row.merchant,
      category: row.category,
      amount: row.amount,
      city: row.city,
      country: row.country,
    }));

    const summary = await summarizeCalculatedResult(message, {
      ...result,
      filters,
      question: message,
    });

    const chartType = validateChartType(query.intent, query.groupBy, query.chartType);

    const nextContext = {
      intent: query.intent,
      category: query.category,
      merchant: query.merchant,
      department: query.department,
      employeeName: query.employeeName,
      city: query.city,
      stateProvince: query.stateProvince,
      country: query.country,
      dateRange: query.dateRange,
      groupBy: query.groupBy,
      metric: query.metric || result.metric,
      chartType,
    };

    setContext(conversationId, nextContext);

    return res.json({
      summary,
      chartType,
      chartData,
      tableData,
      context: {
        category: query.category,
        dateRange: query.dateRange,
        groupBy: query.groupBy,
        metric: query.metric || result.metric,
      },
      followUps: buildFollowUps(query.intent),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process ask query' });
  }
});

module.exports = router;
