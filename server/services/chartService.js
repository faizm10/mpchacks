function chooseChartType(intent, groupBy) {
  if (intent === 'compare_spend') return 'bar';
  if (groupBy === 'date' || groupBy === 'month') return 'line';
  if (groupBy === 'category') return 'pie';
  if (groupBy === 'merchant') return 'bar';
  if (groupBy === 'country') return 'bar';
  if (groupBy === 'stateProvince') return 'bar';
  return 'table';
}

function validateChartType(intent, groupBy, requested) {
  const computed = chooseChartType(intent, groupBy);
  if (!requested) return computed;

  const allowed = new Set(['bar', 'line', 'pie', 'table']);
  if (!allowed.has(requested)) return computed;
  return requested;
}

module.exports = {
  chooseChartType,
  validateChartType,
};
