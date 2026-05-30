const { recommendApproval } = require('./geminiService');

function getMonth(dateStr) {
  return String(dateStr || '').slice(0, 7);
}

function buildDepartmentBudgetMap(departments) {
  const map = {};
  departments.forEach(d => {
    map[d.name] = Number(d.monthlyBudget || 0);
  });
  return map;
}

function countViolationsByEmployee(violations) {
  const map = {};
  violations.forEach(v => {
    map[v.employeeName] = (map[v.employeeName] || 0) + 1;
  });
  return map;
}

function computeEmployeeMonthSpend(transactions) {
  const map = {};
  transactions.forEach(txn => {
    const key = `${txn.employeeId}|${getMonth(txn.transactionDate)}`;
    map[key] = (map[key] || 0) + Number(txn.amount || 0);
  });
  return map;
}

function computeDepartmentMonthSpend(transactions) {
  const map = {};
  transactions.forEach(txn => {
    const key = `${txn.department}|${getMonth(txn.transactionDate)}`;
    map[key] = (map[key] || 0) + Number(txn.amount || 0);
  });
  return map;
}

async function generateApprovalRequests(transactions, violations, departments) {
  const policyByTxn = {};
  violations.forEach(v => {
    if (!policyByTxn[v.transactionId]) policyByTxn[v.transactionId] = [];
    policyByTxn[v.transactionId].push(v.ruleName);
  });

  const deptBudget = buildDepartmentBudgetMap(departments);
  const employeeMonthSpend = computeEmployeeMonthSpend(transactions);
  const deptMonthSpend = computeDepartmentMonthSpend(transactions);
  const recentViolations = countViolationsByEmployee(violations);

  const approvals = [];

  for (const txn of transactions) {
    const policyIssues = policyByTxn[txn.id] || [];
    const needsApproval = Number(txn.amount || 0) > 50
      || txn.preAuthorized === false
      || policyIssues.length > 0;

    if (!needsApproval) continue;

    const monthKeyEmp = `${txn.employeeId}|${getMonth(txn.transactionDate)}`;
    const monthKeyDept = `${txn.department}|${getMonth(txn.transactionDate)}`;

    const request = {
      id: `approval_${String(approvals.length + 1).padStart(3, '0')}`,
      transactionId: txn.id,
      employeeName: txn.employeeName,
      department: txn.department,
      merchantName: txn.merchantName,
      amount: Number(txn.amount || 0),
      category: txn.category,
      status: 'pending',
      policyIssues,
      departmentBudgetRemaining: Number(((deptBudget[txn.department] || 0) - (deptMonthSpend[monthKeyDept] || 0)).toFixed(2)),
      employeeSpendThisMonth: Number((employeeMonthSpend[monthKeyEmp] || 0).toFixed(2)),
      recentViolations: recentViolations[txn.employeeName] || 0,
      receiptAttached: txn.receiptAttached,
      preAuthorized: txn.preAuthorized,
      aiRecommendation: null,
    };

    request.aiRecommendation = await recommendApproval(request);
    approvals.push(request);
  }

  return approvals;
}

module.exports = {
  generateApprovalRequests,
};
