const departments = ['Marketing', 'Engineering', 'Sales', 'Finance'];
const categories = ['Software', 'Travel', 'Meals', 'Office Supplies'];

function detectDepartment(message) {
  const lower = message.toLowerCase();
  return departments.find(d => lower.includes(d.toLowerCase())) || null;
}

function detectCategory(message) {
  const lower = message.toLowerCase();
  return categories.find(c => lower.includes(c.toLowerCase())) || null;
}

function detectDateRange(message) {
  const lower = message.toLowerCase();
  if (lower.includes('last quarter')) return 'last_quarter';
  if (lower.includes('this quarter')) return 'this_quarter';
  if (lower.includes('last month')) return 'last_month';
  if (lower.includes('this month')) return 'this_month';
  if (lower.includes('last year')) return 'last_year';
  return null;
}

function detectIntent(message) {
  const lower = message.toLowerCase();
  if (lower.includes('total') && lower.includes('spend')) return 'total_spend';
  if (lower.includes('spent')) return 'total_spend';
  if (lower.includes('compare')) return 'compare_spend';
  if (lower.includes('unusual')) return 'unusual_transactions';
  return 'total_spend';
}

function detectGroupBy(message) {
  const lower = message.toLowerCase();
  if (lower.includes('by month') || lower.includes('monthly')) return 'month';
  if (lower.includes('by merchant')) return 'merchant';
  if (lower.includes('by department')) return 'department';
  if (lower.includes('last quarter')) return 'month';
  return null;
}

function parseUserQuery(message) {
  return {
    intent: detectIntent(message),
    department: detectDepartment(message),
    category: detectCategory(message),
    dateRange: detectDateRange(message),
    groupBy: detectGroupBy(message),
  };
}

module.exports = {
  departments,
  categories,
  parseUserQuery,
};
