function askHandler(req, res) {
  const { message = '', conversationId = null } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'message is required and must be a string',
    });
  }

  return res.json({
    summary: 'Marketing spent $18,420 on software last quarter.',
    chartType: 'bar',
    chartData: [],
    tableData: [],
    context: {
      department: 'Marketing',
      category: 'Software',
      dateRange: 'last_quarter',
      metric: 'total_spend',
    },
    followUps: [
      'Compare with Engineering',
      'Break down by merchant',
      'Show unusual transactions',
    ],
    meta: {
      conversationId,
      echoedMessage: message,
    },
  });
}

module.exports = {
  askHandler,
};
