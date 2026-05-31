const express = require('express');
const {
  understandQuestion,
  resolveFollowUp,
  summarizeCalculatedResult,
} = require('../services/geminiService');
const { getContext, setContext } = require('../services/conversationMemoryService');
const {
  filterTransactions,
  getLatestTransactionDate,
  getTotalSpend,
  groupSpend,
  compareSpend,
  getTopMerchants,
  getTopTransactions,
  getSpendTrend,
  normalizeRange,
} = require('../services/analyticsService');
const { validateChartType } = require('../services/chartService');
const { readJson, resolveJsonPath } = require('../services/fileStore');
const { canonicalizeQuery } = require('../services/queryCanonicalizer');
const ml = require('../ml');

const router = express.Router();
const LOG_PREFIX = '[ask]';

function buildFollowUps(intent) {
  if (intent === 'out_of_scope') {
    return [
      'What did we spend on fuel last month?',
      'Show fuel spend by month',
      'Which merchants drove fuel spend?',
    ];
  }
  if (intent === 'small_talk') {
    return [
      'What did we spend on fuel last month?',
      'Show top merchants this quarter',
      'Which department has the most policy violations?',
    ];
  }
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

function summarizeUnavailableFilter(resolution, available) {
  if (resolution.department.matchType === 'missing' && resolution.department.requested) {
    return `No transactions match the "${resolution.department.requested}" department because that department is not present in this dataset. Available departments are: ${available.departments.join(', ')}.`;
  }

  if (resolution.category.matchType === 'missing' && resolution.category.requested) {
    const closest = resolution.category.closest ? ` Closest available category: ${resolution.category.closest}.` : '';
    return `No transactions match the "${resolution.category.requested}" category because that category is not present in this dataset.${closest}`;
  }

  return null;
}

function extractFilters(query, now) {
  return {
    category: query.category || null,
    merchant: query.merchant || null,
    department: query.department || null,
    employeeName: query.employeeName || null,
    city: query.city || null,
    stateProvince: query.stateProvince || null,
    country: query.country || null,
    dateRange: query.dateRange?.value || query.dateRange || null,
    now,
  };
}

function calcResult(transactions, query, filters) {
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
    console.info(LOG_PREFIX, 'request received', { message, conversationId });
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const transactionsPath = resolveJsonPath('data/transactions_enriched.json');
    const transactions = readJson('data/transactions_enriched.json', []);
    const latestTransactionDate = getLatestTransactionDate(transactions);
    const analyticsNow = latestTransactionDate || new Date();
    console.info(LOG_PREFIX, 'transactions loaded', {
      path: transactionsPath,
      count: transactions.length,
      latestTransactionDate: latestTransactionDate?.toISOString().slice(0, 10) || null,
    });

    const previous = getContext(conversationId);

    const lower = String(message).toLowerCase();
    const followupWords = ['that', 'those', 'it', 'them', 'compare'];
    const isLikelyFollowup = followupWords.some(w => lower.includes(w)) && previous?.lastContext;

    const rawQuery = isLikelyFollowup
      ? await resolveFollowUp(message, previous.lastContext)
      : await understandQuestion(message);
    console.info(LOG_PREFIX, 'parsed query object', { query: rawQuery, isLikelyFollowup });

    const canonical = canonicalizeQuery(rawQuery, message, transactions);
    const query = canonical.query;
    console.info(LOG_PREFIX, 'available transaction dimensions', {
      category: canonical.available.categories,
      department: canonical.available.departments,
      merchantNameCount: canonical.available.merchantNames.length,
      merchantName: canonical.available.merchantNames,
      country: canonical.available.countries,
      stateProvince: canonical.available.stateProvinces,
    });
    console.info(LOG_PREFIX, 'canonical query object', {
      before: rawQuery,
      after: query,
      resolution: canonical.resolution,
    });

    if (query.intent === 'small_talk') {
      console.info(LOG_PREFIX, 'returning small_talk response');
      return res.json({
        summary: "I’m doing well. I can help with fleet spend analytics, compliance trends, merchants, and time-based comparisons. Try asking a finance question like: 'What did we spend on fuel last month?'",
        chartType: null,
        chartData: [],
        tableData: [],
        context: {
          category: null,
          dateRange: null,
          groupBy: null,
          metric: 'small_talk',
        },
        followUps: buildFollowUps('small_talk'),
      });
    }

    if (query.intent === 'out_of_scope') {
      console.info(LOG_PREFIX, 'returning out_of_scope response', { query });
      return res.json({
        summary: "I can answer questions about your company’s transaction data, but I don’t have live market pricing. Try asking what we spent on gas or fuel instead.",
        chartType: null,
        chartData: [],
        tableData: [],
        context: {
          category: query.category,
          dateRange: query.dateRange,
          groupBy: query.groupBy,
          metric: 'out_of_scope',
        },
        followUps: buildFollowUps('out_of_scope'),
      });
    }

    const filters = extractFilters(query, analyticsNow);
    const filtered = filterTransactions(transactions, filters);
    const normalizedDateRange = normalizeRange(filters.dateRange, filters.now);
    console.info(LOG_PREFIX, 'filters applied', {
      filters: { ...filters, now: filters.now?.toISOString?.().slice(0, 10) || filters.now },
      normalizedDateRange,
      matchingTransactions: filtered.length,
    });

    const unavailableSummary = summarizeUnavailableFilter(canonical.resolution, canonical.available);
    if (unavailableSummary) {
      const unavailableTotal = Number(getTotalSpend(transactions, filters).toFixed(2));
      console.info(LOG_PREFIX, 'unavailable filter detected', {
        resolution: canonical.resolution,
        matchingTransactions: filtered.length,
        calculatedTotal: unavailableTotal,
        summary: unavailableSummary,
      });
      return res.json({
        summary: unavailableSummary,
        chartType: null,
        chartData: [],
        tableData: [],
        context: {
          category: query.category,
          department: query.department,
          dateRange: query.dateRange,
          groupBy: query.groupBy,
          metric: query.metric,
          resolution: canonical.resolution,
        },
        followUps: buildFollowUps(query.intent),
      });
    }

    if (query.intent === 'predict_spend') {
      let forecast = null;
      let forecastLabel = null;

      if (query.department) {
        forecast = ml.getDepartmentForecast(query.department);
        forecastLabel = query.department;
      } else if (query.category) {
        forecast = ml.getCategoryForecast(query.category);
        forecastLabel = query.category;
      } else {
        forecast = { predicted: 0, confidence: 0, trend: 'no_data', dataPoints: 0 };
        forecastLabel = 'all categories';
      }

      const trendLabel = forecast.trend === 'rising' ? 'trending up'
                       : forecast.trend === 'falling' ? 'trending down'
                       : 'relatively stable';

      let summary;
      if (!forecast.predicted) {
        summary = `There isn't enough historical data yet to forecast spend for ${forecastLabel}. More transaction months are needed to generate a reliable prediction.`;
      } else {
        summary = `Based on historical trends, predicted spend for ${forecastLabel} next month is $${Number(forecast.predicted).toLocaleString()} (${trendLabel}, ${forecast.confidence}% confidence based on ${forecast.dataPoints} months of data).`;
        if (forecast.monthsUntilHighConfidence > 0) {
          summary += ` Confidence will improve in ~${forecast.monthsUntilHighConfidence} more month(s) of data.`;
        }
      }

      const chartData = (forecast.history || []).map(d => ({ name: d.month, value: d.spend }));
      if (forecast.predicted) {
        const nextMonth = forecast.history?.length
          ? (() => {
              const last = forecast.history[forecast.history.length - 1].month;
              const [y, m] = last.split('-').map(Number);
              const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
              return next;
            })()
          : 'next';
        chartData.push({ name: nextMonth, value: forecast.predicted, predicted: true });
      }

      console.info(LOG_PREFIX, 'predict_spend response', { forecastLabel, forecast });
      return res.json({
        summary,
        chartType: 'bar',
        chartData,
        tableData: [],
        context: {
          category: query.category,
          department: query.department,
          dateRange: null,
          groupBy: 'month',
          metric: 'predict_spend',
        },
        followUps: [
          'Show spending trend over time',
          'Which department spends the most?',
          'Show top merchants this quarter',
        ],
      });
    }

    const result = calcResult(transactions, query, filters);

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
    console.info(LOG_PREFIX, 'response data sources', {
      chartDataCount: chartData.length,
      tableDataCount: tableData.length,
      filteredTransactionCount: filtered.length,
      resultMetric: result.metric,
      resultTotal: result.total,
    });

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
        department: query.department,
        dateRange: query.dateRange,
        groupBy: query.groupBy,
        metric: query.metric || result.metric,
        resolution: canonical.resolution,
      },
      followUps: buildFollowUps(query.intent),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process ask query' });
  }
});

module.exports = router;
