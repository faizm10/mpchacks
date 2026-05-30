function toDate(value) {
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfQuarter(date) {
  const month = date.getUTCMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}

function addMonths(date, delta) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

function addYears(date, delta) {
  return new Date(Date.UTC(date.getUTCFullYear() + delta, date.getUTCMonth(), 1));
}

function isWithinDateRange(date, dateRange, now = new Date()) {
  if (!dateRange) return true;
  const d = toDate(date);
  if (!d) return false;

  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  if (dateRange === 'this_month') {
    const start = currentMonthStart;
    const end = addMonths(start, 1);
    return d >= start && d < end;
  }

  if (dateRange === 'last_month') {
    const end = currentMonthStart;
    const start = addMonths(end, -1);
    return d >= start && d < end;
  }

  if (dateRange === 'this_quarter') {
    const start = startOfQuarter(now);
    const end = addMonths(start, 3);
    return d >= start && d < end;
  }

  if (dateRange === 'last_quarter') {
    const thisQuarterStart = startOfQuarter(now);
    const start = addMonths(thisQuarterStart, -3);
    const end = thisQuarterStart;
    return d >= start && d < end;
  }

  if (dateRange === 'last_year') {
    const start = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    return d >= start && d < end;
  }

  if (dateRange === 'this_year') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end = addYears(start, 1);
    return d >= start && d < end;
  }

  return true;
}

function equalsIgnoreCase(a, b) {
  if (a == null || b == null) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function buildPredicate(filters = {}) {
  return function predicate(txn) {
    if (filters.department && !equalsIgnoreCase(txn.department, filters.department)) return false;

    if (Array.isArray(filters.departments) && filters.departments.length > 0) {
      const ok = filters.departments.some(d => equalsIgnoreCase(txn.department, d));
      if (!ok) return false;
    }

    if (filters.category && !equalsIgnoreCase(txn.category, filters.category)) return false;
    if (filters.merchant && !equalsIgnoreCase(txn.merchant, filters.merchant)) return false;
    if (!isWithinDateRange(txn.date, filters.dateRange, filters.now)) return false;
    return true;
  };
}

function filterTransactions(transactions, filters = {}) {
  const predicate = buildPredicate(filters);
  return transactions.filter(predicate);
}

function getTotalSpend(transactions, filters = {}) {
  return filterTransactions(transactions, filters)
    .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
}

function compareDepartmentSpend(transactions, filters = {}) {
  const departments = filters.departments || [];
  const result = departments.map(department => {
    const total = getTotalSpend(transactions, { ...filters, department, departments: undefined });
    return { department, total: Number(total.toFixed(2)) };
  });

  return result;
}

function groupSpendByMonth(transactions, filters = {}) {
  const grouped = {};
  filterTransactions(transactions, filters).forEach(txn => {
    const month = String(txn.date || '').slice(0, 7) || 'unknown';
    grouped[month] = (grouped[month] || 0) + Number(txn.amount || 0);
  });

  return Object.entries(grouped)
    .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function groupSpendByMerchant(transactions, filters = {}) {
  const grouped = {};
  filterTransactions(transactions, filters).forEach(txn => {
    const merchant = txn.merchant || 'Unknown';
    grouped[merchant] = (grouped[merchant] || 0) + Number(txn.amount || 0);
  });

  return Object.entries(grouped)
    .map(([merchant, total]) => ({ merchant, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);
}

function getTopTransactions(transactions, filters = {}, limit = 10) {
  return filterTransactions(transactions, filters)
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, limit);
}

module.exports = {
  isWithinDateRange,
  filterTransactions,
  getTotalSpend,
  compareDepartmentSpend,
  groupSpendByMonth,
  groupSpendByMerchant,
  getTopTransactions,
};
