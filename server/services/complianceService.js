function checkApprovalThreshold(transaction, rule) {
  if (Number(transaction.amount || 0) > Number(rule.amountThreshold || 0) && transaction.preAuthorized === false) {
    return true;
  }
  return false;
}

function checkReceiptRequired(transaction) {
  return transaction.receiptAttached === false;
}

function checkRestrictedCategory(transaction, rule) {
  return String(transaction.category || '').toLowerCase() === String(rule.category || '').toLowerCase()
    && String(transaction.businessPurpose || '').toLowerCase() !== 'customer entertainment';
}

function checkRestrictedDescription(transaction, rule) {
  const text = `${transaction.description || ''} ${transaction.merchantName || ''}`.toLowerCase();
  return (rule.keywords || []).some(k => text.includes(String(k).toLowerCase()));
}

function detectSplitTransactions(transactions, threshold = 50) {
  const grouped = {};
  transactions.forEach(txn => {
    const key = `${txn.employeeId}|${txn.merchantName}|${txn.transactionDate}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(txn);
  });

  const flagged = new Set();
  Object.values(grouped).forEach(group => {
    if (group.length < 2) return;
    const total = group.reduce((s, x) => s + Number(x.amount || 0), 0);
    const allSmall = group.every(x => Number(x.amount || 0) <= threshold + 5);
    if (total > threshold && allSmall) {
      group.forEach(txn => flagged.add(txn.id));
    }
  });
  return flagged;
}

function detectDuplicateTransactions(transactions) {
  const seen = new Set();
  const dupes = new Set();
  transactions.forEach(txn => {
    const key = `${txn.employeeId}|${txn.merchantName}|${txn.transactionDate}|${Number(txn.amount || 0).toFixed(2)}`;
    if (seen.has(key)) dupes.add(txn.id);
    seen.add(key);
  });
  return dupes;
}

function calculateSeverity(baseSeverity, transaction) {
  if (baseSeverity === 'high') return 'high';
  if (Number(transaction.amount || 0) > 1000) return 'high';
  return baseSeverity || 'medium';
}

function scanTransactions(transactions, policyRules) {
  const violations = [];
  const splitSet = detectSplitTransactions(transactions, 50);
  const duplicateSet = detectDuplicateTransactions(transactions);

  transactions.forEach((txn) => {
    policyRules.forEach(rule => {
      let triggered = false;
      if (rule.type === 'approval_threshold') triggered = checkApprovalThreshold(txn, rule);
      if (rule.type === 'receipt_required') triggered = checkReceiptRequired(txn);
      if (rule.type === 'restricted_category') triggered = checkRestrictedCategory(txn, rule);
      if (rule.type === 'restricted_description') triggered = checkRestrictedDescription(txn, rule);
      if (rule.type === 'split_transaction') triggered = splitSet.has(txn.id);

      if (triggered) {
        violations.push({
          id: `vio_${String(violations.length + 1).padStart(4, '0')}`,
          transactionId: txn.id,
          employeeName: txn.employeeName,
          department: txn.department,
          merchantName: txn.merchantName,
          amount: Number(txn.amount || 0),
          category: txn.category,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: calculateSeverity(rule.severity, txn),
          aiExplanation: null,
          recommendedAction: 'Request manager approval',
          status: 'open',
        });
      }
    });

    if (duplicateSet.has(txn.id)) {
      violations.push({
        id: `vio_${String(violations.length + 1).padStart(4, '0')}`,
        transactionId: txn.id,
        employeeName: txn.employeeName,
        department: txn.department,
        merchantName: txn.merchantName,
        amount: Number(txn.amount || 0),
        category: txn.category,
        ruleId: 'rule_duplicate',
        ruleName: 'Potential duplicate transaction',
        severity: 'high',
        aiExplanation: null,
        recommendedAction: 'Review for duplicate charge',
        status: 'open',
      });
    }
  });

  return violations;
}

module.exports = {
  scanTransactions,
  checkApprovalThreshold,
  checkReceiptRequired,
  checkRestrictedCategory,
  checkRestrictedDescription,
  detectSplitTransactions,
  detectDuplicateTransactions,
  calculateSeverity,
};
