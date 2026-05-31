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
const { scanTransactions } = require('../services/complianceService');
const ml = require('../ml');

const router = express.Router();
const LOG_PREFIX = '[ask]';

function buildFollowUps(intent) {
  if (intent === 'top_categories') {
    return [
      'Show top merchants in the biggest category',
      'How has spend trended month over month?',
      'What is driving compliance risk?',
    ];
  }
  if (intent === 'spend_trend') {
    return [
      'Break that trend down by category',
      'Which month had the highest spend?',
      'Forecast next month spend',
    ];
  }
  if (intent === 'compliance_summary' || intent === 'top_violations') {
    return [
      'Which fleet unit has the most violations?',
      'Show the most common policy failures',
      'Which merchants are highest risk?',
    ];
  }
  if (intent === 'top_fleet_units') {
    return [
      'What is driving compliance risk?',
      'Show the most common policy failures',
      'Show top transactions for that fleet unit',
    ];
  }
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

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function displayCategoryName(category) {
  if (/^\d+$/.test(String(category || ''))) return `Other / uncategorized (${category})`;
  return category || 'Unknown';
}

function getComputedViolations(transactions) {
  const policyRules = readJson('data/policyRules.json', []);
  const storedViolations = readJson('data/violations.json', []);

  if (Array.isArray(storedViolations) && storedViolations.length > 0) {
    return {
      violations: storedViolations,
      source: 'stored',
      policyRules,
    };
  }

  return {
    violations: scanTransactions(transactions, policyRules),
    source: 'computed',
    policyRules,
  };
}

function countBy(rows, keyFn) {
  const counts = {};
  rows.forEach(row => {
    const key = keyFn(row) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function sumBy(rows, keyFn) {
  const sums = {};
  rows.forEach(row => {
    const key = keyFn(row) || 'Unknown';
    sums[key] = (sums[key] || 0) + Number(row.amount || 0);
  });
  return Object.entries(sums)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
}

function buildTopCategoriesResult(transactions, filters) {
  const categories = groupSpend(transactions, 'category', filters)
    .map(row => ({ ...row, name: displayCategoryName(row.name), rawCategory: row.name }));
  const top = categories.slice(0, 5);
  const leader = top[0];

  return {
    summary: leader
      ? `Your top spend category is ${leader.name} at ${formatMoney(leader.value)}. Top categories: ${top.map(row => `${row.name} (${formatMoney(row.value)})`).join(', ')}.`
      : 'No category spend matched the selected filters.',
    chartType: 'bar',
    chartData: top,
    tableData: top.map((row, index) => ({
      rank: index + 1,
      category: row.name,
      total: row.value,
    })),
    resultType: 'top_categories',
  };
}

function buildSpendTrendResult(transactions, filters) {
  const trend = getSpendTrend(transactions, filters);
  const first = trend[0];
  const last = trend[trend.length - 1];
  const peak = [...trend].sort((a, b) => b.value - a.value)[0];
  const delta = first && last ? Number((last.value - first.value).toFixed(2)) : 0;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return {
    summary: trend.length
      ? `Spend is trending ${direction} month over month. It moved from ${formatMoney(first.value)} in ${first.name} to ${formatMoney(last.value)} in ${last.name}; the peak month was ${peak.name} at ${formatMoney(peak.value)}.`
      : 'No monthly spend data matched the selected filters.',
    chartType: 'line',
    chartData: trend,
    tableData: trend.map(row => ({
      month: row.name,
      total: row.value,
    })),
    resultType: 'spend_trend',
  };
}

function buildTopViolationsResult(transactions) {
  const { violations, source } = getComputedViolations(transactions);
  const byRule = countBy(violations, v => v.ruleName);
  const top = byRule.slice(0, 5);

  return {
    summary: top.length
      ? `The most common policy issue is "${top[0].name}" with ${top[0].value} violations. Top violation drivers: ${top.map(row => `${row.name} (${row.value})`).join(', ')}.`
      : 'No policy violations were found in the current transaction set.',
    chartType: 'bar',
    chartData: top,
    tableData: top.map((row, index) => ({
      rank: index + 1,
      violationType: row.name,
      count: row.value,
    })),
    resultType: 'top_violations',
    source,
  };
}

function buildTopFleetUnitsResult(transactions) {
  const { violations, source } = getComputedViolations(transactions);
  const txnById = new Map(transactions.map(txn => [txn.id, txn]));
  const enriched = violations.map(v => ({ ...v, transaction: txnById.get(v.transactionId) }));
  const byFleetUnit = countBy(enriched, v => v.transaction?.transactionCode ? `Fleet Unit ${v.transaction.transactionCode}` : 'Unknown fleet unit');
  const top = byFleetUnit.slice(0, 5);

  return {
    summary: top.length
      ? `${top[0].name} has the most policy violations with ${top[0].value} flagged issues. Top fleet units: ${top.map(row => `${row.name} (${row.value})`).join(', ')}.`
      : 'No fleet-unit policy violations were found in the current transaction set.',
    chartType: 'bar',
    chartData: top,
    tableData: top.map((row, index) => ({
      rank: index + 1,
      fleetUnit: row.name,
      violationCount: row.value,
    })),
    resultType: 'top_fleet_units',
    source,
  };
}

function buildComplianceSummaryResult(transactions) {
  const { violations, source } = getComputedViolations(transactions);
  const totalViolations = violations.length;
  const highSeverity = violations.filter(v => v.severity === 'high').length;
  const missingApprovals = violations.filter(v => /pre-authorization|approval/i.test(v.ruleName || '')).length;
  const missingReceipts = violations.filter(v => /receipt/i.test(v.ruleName || '')).length;
  const topViolationTypes = countBy(violations, v => v.ruleName).slice(0, 5);
  const repeatOffenders = countBy(violations, v => v.employeeName).slice(0, 5);
  const riskyMerchants = sumBy(violations, v => v.merchantName).slice(0, 5);

  const topDriver = topViolationTypes[0];
  return {
    summary: totalViolations
      ? `Compliance risk is mainly driven by ${topDriver.name} (${topDriver.value} violations). There are ${totalViolations} total violations, including ${highSeverity} high-severity issues, ${missingApprovals} approval-related flags, and ${missingReceipts} receipt-related flags.`
      : 'No compliance violations were found in the current transaction set.',
    chartType: 'bar',
    chartData: topViolationTypes,
    tableData: [
      { metric: 'Total violations', value: totalViolations },
      { metric: 'High-severity violations', value: highSeverity },
      { metric: 'Approval-related flags', value: missingApprovals },
      { metric: 'Receipt-related flags', value: missingReceipts },
      ...topViolationTypes.map(row => ({ metric: row.name, value: row.value })),
    ],
    context: {
      topViolationTypes,
      repeatOffenders,
      riskyMerchants,
      missingApprovals,
      missingReceipts,
    },
    resultType: 'compliance_summary',
    source,
  };
}

function buildCompareCategoriesResult(transactions, filters, query) {
  const categories = Array.isArray(query.compareValues) && query.compareValues.length
    ? query.compareValues
    : ['Fuel', 'Meals', 'Software', 'Equipment', 'Travel'];
  const comparison = categories.map(category => ({
    name: category,
    value: Number(getTotalSpend(transactions, { ...filters, category }).toFixed(2)),
  })).sort((a, b) => b.value - a.value);

  return {
    summary: comparison.length
      ? `Category comparison: ${comparison.map(row => `${row.name} (${formatMoney(row.value)})`).join(', ')}.`
      : 'No category comparison data matched the selected filters.',
    chartType: 'bar',
    chartData: comparison,
    tableData: comparison.map(row => ({ category: row.name, total: row.value })),
    resultType: 'compare_categories',
  };
}

function buildCompareTimePeriodsResult(transactions, filters) {
  const trend = getSpendTrend(transactions, filters);
  const recent = trend.slice(-6);

  return {
    summary: recent.length
      ? `Recent period comparison: ${recent.map(row => `${row.name} (${formatMoney(row.value)})`).join(', ')}.`
      : 'No period comparison data matched the selected filters.',
    chartType: 'bar',
    chartData: recent,
    tableData: recent.map(row => ({ period: row.name, total: row.value })),
    resultType: 'compare_time_periods',
  };
}

function runIntentHandler(intent, transactions, filters, query) {
  const handlers = {
    top_categories: () => buildTopCategoriesResult(transactions, filters),
    spend_trend: () => buildSpendTrendResult(transactions, filters),
    compliance_summary: () => buildComplianceSummaryResult(transactions),
    top_violations: () => buildTopViolationsResult(transactions),
    top_fleet_units: () => buildTopFleetUnitsResult(transactions),
    compare_categories: () => buildCompareCategoriesResult(transactions, filters, query),
    compare_time_periods: () => buildCompareTimePeriodsResult(transactions, filters),
  };

  const handler = handlers[intent];
  if (!handler) return null;

  console.info(LOG_PREFIX, 'selected analytics handler', { intent, handler: intent });
  const result = handler();
  console.info(LOG_PREFIX, 'handler result', {
    intent,
    resultType: result.resultType,
    chartDataCount: result.chartData?.length || 0,
    tableDataCount: result.tableData?.length || 0,
  });
  return result;
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
    console.info(LOG_PREFIX, 'detected intent', {
      rawIntent: rawQuery.intent,
      canonicalIntent: query.intent,
      metric: query.metric,
    });
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

    const intentResult = runIntentHandler(query.intent, transactions, filters, query);
    if (intentResult) {
      const chartType = intentResult.chartType || validateChartType(query.intent, query.groupBy, query.chartType);
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
        metric: query.metric || intentResult.resultType,
        chartType,
      };

      setContext(conversationId, nextContext);

      return res.json({
        summary: intentResult.summary,
        chartType,
        chartData: intentResult.chartData || [],
        tableData: intentResult.tableData || [],
        context: {
          ...nextContext,
          resolution: canonical.resolution,
          resultType: intentResult.resultType,
          ...(intentResult.context || {}),
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
