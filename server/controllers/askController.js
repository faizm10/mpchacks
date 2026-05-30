const { parseUserQuery } = require('../utils/queryParser');
const { getConversationContext, setConversationContext } = require('../utils/conversationMemory');
const { chooseChartType } = require('../utils/chartSelector');
const {
  getTotalSpend,
  compareDepartmentSpend,
  groupSpendByMonth,
  groupSpendByMerchant,
  getTopTransactions,
} = require('../utils/analytics');
const { loadTransactions } = require('../utils/transactionStore');
const { generateAISummary } = require('../utils/aiSummary');

function mergeWithPreviousContext(parsed, previousContext, message) {
  if (!previousContext) return parsed;

  const lower = String(message || '').toLowerCase();
  const merged = {
    intent: parsed.intent || previousContext.metric || 'total_spend',
    department: parsed.department || previousContext.department || null,
    category: parsed.category || previousContext.category || null,
    dateRange: parsed.dateRange || previousContext.dateRange || null,
    groupBy: parsed.groupBy || previousContext.groupBy || null,
  };

  const isCompareFollowup = merged.intent === 'compare_spend' && lower.includes('that');
  if (isCompareFollowup) {
    const departments = [];
    if (previousContext.department) departments.push(previousContext.department);
    if (parsed.department && !departments.includes(parsed.department)) departments.push(parsed.department);

    return {
      ...merged,
      departments,
      metric: previousContext.metric || 'total_spend',
    };
  }

  return merged;
}

function buildResult(transactions, query) {
  if (query.intent === 'compare_spend' && Array.isArray(query.departments) && query.departments.length > 0) {
    const comparison = compareDepartmentSpend(transactions, {
      departments: query.departments,
      category: query.category,
      dateRange: query.dateRange,
    });

    return {
      intent: query.intent,
      comparison,
      departments: query.departments,
      category: query.category,
      dateRange: query.dateRange,
      metric: 'total_spend',
    };
  }

  const total = getTotalSpend(transactions, {
    department: query.department,
    category: query.category,
    dateRange: query.dateRange,
  });

  const topMerchants = groupSpendByMerchant(transactions, {
    department: query.department,
    category: query.category,
    dateRange: query.dateRange,
  })
    .slice(0, 3)
    .map(x => x.merchant);

  return {
    intent: query.intent,
    total: Number(total.toFixed(2)),
    department: query.department,
    category: query.category,
    dateRange: query.dateRange,
    metric: 'total_spend',
    topMerchants,
  };
}

function buildChartData(transactions, query) {
  if (query.groupBy === 'month') {
    return groupSpendByMonth(transactions, {
      department: query.department,
      category: query.category,
      dateRange: query.dateRange,
      departments: query.departments,
    });
  }

  if (query.groupBy === 'merchant') {
    return groupSpendByMerchant(transactions, {
      department: query.department,
      category: query.category,
      dateRange: query.dateRange,
      departments: query.departments,
    }).slice(0, 10);
  }

  if (query.intent === 'compare_spend' && Array.isArray(query.departments)) {
    return compareDepartmentSpend(transactions, {
      departments: query.departments,
      category: query.category,
      dateRange: query.dateRange,
    });
  }

  return [];
}

function buildTableData(transactions, query) {
  return getTopTransactions(transactions, {
    department: query.department,
    departments: query.departments,
    category: query.category,
    dateRange: query.dateRange,
  }, 10);
}

async function askHandler(req, res) {
  const { message = '', conversationId = null } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'message is required and must be a string',
    });
  }

  const parsed = parseUserQuery(message);
  const previous = getConversationContext(conversationId);
  const mergedQuery = mergeWithPreviousContext(parsed, previous?.lastContext || null, message);

  const transactions = loadTransactions();
  const result = buildResult(transactions, mergedQuery);
  const summary = await generateAISummary(message, result);

  const nextContext = {
    conversationId,
    lastContext: {
      department: mergedQuery.department || (mergedQuery.departments ? mergedQuery.departments[0] : null),
      category: mergedQuery.category || null,
      dateRange: mergedQuery.dateRange || null,
      metric: result.metric || mergedQuery.intent || 'total_spend',
      groupBy: mergedQuery.groupBy || null,
    },
  };
  setConversationContext(conversationId, nextContext);

  return res.json({
    summary,
    chartType: chooseChartType(mergedQuery.intent, mergedQuery.groupBy),
    chartData: buildChartData(transactions, mergedQuery),
    tableData: buildTableData(transactions, mergedQuery),
    context: {
      department: mergedQuery.department || null,
      departments: mergedQuery.departments || undefined,
      category: mergedQuery.category || null,
      dateRange: mergedQuery.dateRange || null,
      metric: result.metric,
      groupBy: mergedQuery.groupBy || null,
    },
    computedResult: result,
    parsedQuery: mergedQuery,
    followUps: [
      'Compare with Engineering',
      'Break down by merchant',
      'Show unusual transactions',
    ],
    memory: nextContext,
    meta: {
      conversationId,
      echoedMessage: message,
    },
  });
}

module.exports = {
  askHandler,
};
