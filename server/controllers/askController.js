const { parseUserQuery } = require('../utils/queryParser');
const { getConversationContext, setConversationContext } = require('../utils/conversationMemory');

function buildContextFromParsed(parsed) {
  return {
    department: parsed.department || null,
    category: parsed.category || null,
    dateRange: parsed.dateRange || null,
    metric: parsed.intent || 'total_spend',
    groupBy: parsed.groupBy || null,
  };
}

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

function askHandler(req, res) {
  const { message = '', conversationId = null } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'message is required and must be a string',
    });
  }

  const parsed = parseUserQuery(message);
  const previous = getConversationContext(conversationId);
  const mergedQuery = mergeWithPreviousContext(parsed, previous?.lastContext || null, message);

  const nextContext = {
    conversationId,
    lastContext: {
      department: mergedQuery.department || (mergedQuery.departments ? mergedQuery.departments[0] : null),
      category: mergedQuery.category || null,
      dateRange: mergedQuery.dateRange || null,
      metric: mergedQuery.metric || mergedQuery.intent || 'total_spend',
      groupBy: mergedQuery.groupBy || null,
    },
  };
  setConversationContext(conversationId, nextContext);

  return res.json({
    summary: 'Marketing spent $18,420 on software last quarter.',
    chartType: mergedQuery.intent === 'compare_spend' ? 'bar' : 'bar',
    chartData: [],
    tableData: [],
    context: {
      department: mergedQuery.department || null,
      departments: mergedQuery.departments || undefined,
      category: mergedQuery.category || null,
      dateRange: mergedQuery.dateRange || null,
      metric: mergedQuery.metric || mergedQuery.intent,
      groupBy: mergedQuery.groupBy || null,
    },
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
