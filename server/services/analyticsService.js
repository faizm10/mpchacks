function parseDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeRange(dateRange, now = new Date()) {
  if (!dateRange) return null;

  if (typeof dateRange === 'object' && dateRange.type === 'relative') {
    dateRange = dateRange.value;
  }

  if (typeof dateRange === 'string') {
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    if (dateRange === 'last_quarter') {
      const quarterStartMonth = Math.floor(currentMonthStart.getUTCMonth() / 3) * 3;
      const currentQuarterStart = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), quarterStartMonth, 1));
      const start = new Date(Date.UTC(currentQuarterStart.getUTCFullYear(), currentQuarterStart.getUTCMonth() - 3, 1));
      return { startDate: start.toISOString().slice(0, 10), endDate: currentQuarterStart.toISOString().slice(0, 10) };
    }

    if (dateRange === 'this_month') {
      const end = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() + 1, 1));
      return { startDate: currentMonthStart.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
    }

    if (dateRange === 'last_month') {
      const start = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() - 1, 1));
      return { startDate: start.toISOString().slice(0, 10), endDate: currentMonthStart.toISOString().slice(0, 10) };
    }

    return null;
  }

  return dateRange;
}

function withinRange(date, dateRange, now = new Date()) {
  if (!dateRange) return true;
  const d = parseDate(date);
  if (!d) return false;

  const normalized = normalizeRange(dateRange, now);
  if (!normalized || !normalized.startDate || !normalized.endDate) return true;

  const start = parseDate(normalized.startDate);
  const end = parseDate(normalized.endDate);
  if (!start || !end) return true;

  return d >= start && d < end;
}

function filterTransactions(transactions, filters = {}) {
  return transactions.filter(txn => {
    if (filters.category && !matchesFilter(txn.category, filters.category)) return false;
    if (filters.merchant && !matchesFilter(txn.merchantName, filters.merchant)) return false;
    if (filters.department && !matchesFilter(txn.department, filters.department)) return false;
    if (filters.employeeName && !matchesFilter(txn.employeeName, filters.employeeName)) return false;
    if (filters.city && !matchesFilter(txn.city, filters.city)) return false;
    if (filters.stateProvince && !matchesFilter(txn.stateProvince, filters.stateProvince)) return false;
    if (filters.country && !matchesFilter(txn.country, filters.country)) return false;
    if (!withinRange(txn.transactionDate, filters.dateRange, filters.now)) return false;
    return true;
  });
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesFilter(actual, expected) {
  const normalizedActual = normalizeText(actual);
  const normalizedExpected = normalizeText(expected);
  if (!normalizedExpected) return true;
  if (!normalizedActual) return false;
  if (normalizedActual === normalizedExpected) return true;
  if (normalizedExpected.length < 3) return false;
  return normalizedActual.includes(normalizedExpected) || normalizedExpected.includes(normalizedActual);
}

function getLatestTransactionDate(transactions) {
  const dates = transactions
    .map(txn => parseDate(txn.transactionDate))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  return dates[0] || null;
}

function getTotalSpend(transactions, filters = {}) {
  return filterTransactions(transactions, filters).reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
}

function groupSpend(transactions, groupBy, filters = {}) {
  const grouped = {};
  filterTransactions(transactions, filters).forEach(txn => {
    let key;
    if (groupBy === 'month' || groupBy === 'date') key = String(txn.transactionDate || '').slice(0, 7);
    else if (groupBy === 'merchant') key = txn.merchantName;
    else if (groupBy === 'category') key = txn.category;
    else if (groupBy === 'country') key = txn.country;
    else if (groupBy === 'stateProvince') key = txn.stateProvince;
    else key = txn[groupBy] || 'Unknown';

    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += Number(txn.amount || 0);
  });

  const rows = Object.entries(grouped).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  if (groupBy === 'month' || groupBy === 'date') return rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows.sort((a, b) => b.value - a.value);
}

function compareSpend(transactions, filters = {}) {
  const { field = 'country', values = [] } = filters;
  return values.map(value => ({
    name: value,
    value: Number(getTotalSpend(transactions, { ...filters, [field]: value, values: undefined }).toFixed(2)),
  }));
}

function getTopMerchants(transactions, filters = {}, limit = 5) {
  return groupSpend(transactions, 'merchant', filters).slice(0, limit);
}

function getTopTransactions(transactions, filters = {}, limit = 10) {
  return filterTransactions(transactions, filters)
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, limit)
    .map(txn => ({
      id: txn.id,
      date: txn.transactionDate,
      merchant: txn.merchantName,
      category: txn.category,
      amount: Number(txn.amount || 0),
      city: txn.city,
      country: txn.country,
      employeeName: txn.employeeName,
      department: txn.department,
    }));
}

function getSpendTrend(transactions, filters = {}) {
  return groupSpend(transactions, 'month', filters);
}

module.exports = {
  filterTransactions,
  getLatestTransactionDate,
  matchesFilter,
  normalizeRange,
  getTotalSpend,
  groupSpend,
  compareSpend,
  getTopMerchants,
  getTopTransactions,
  getSpendTrend,
};
