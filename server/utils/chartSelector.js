function chooseChartType(intent, groupBy) {
  if (intent === 'compare_spend') return 'bar';
  if (groupBy === 'month') return 'line';
  if (groupBy === 'category') return 'pie';
  if (groupBy === 'merchant') return 'bar';
  return 'table';
}

module.exports = {
  chooseChartType,
};
