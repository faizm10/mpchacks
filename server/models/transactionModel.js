function normalizeTransaction(input = {}, index = 0) {
  const amount = Number(input.amount ?? input.amount_cad ?? 0);

  return {
    id: String(input.id || `txn_${String(index + 1).padStart(3, '0')}`),
    employeeName: String(input.employeeName || input.employee_name || '').trim(),
    department: String(input.department || '').trim(),
    merchant: String(input.merchant || '').trim(),
    category: String(input.category || input.spend_category || '').trim(),
    amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
    date: String(input.date || '').trim(),
    description: String(input.description || '').trim(),
  };
}

module.exports = { normalizeTransaction };
