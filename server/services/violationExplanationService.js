const { explainPolicyViolation } = require('./geminiService');

async function addViolationExplanations(violations, transactions, policyRules) {
  const txnMap = new Map(transactions.map(t => [t.id, t]));
  const ruleMap = new Map(policyRules.map(r => [r.id, r]));

  for (const violation of violations) {
    const transaction = txnMap.get(violation.transactionId);
    const rule = ruleMap.get(violation.ruleId) || {
      name: violation.ruleName,
      description: violation.ruleName,
    };

    violation.aiExplanation = await explainPolicyViolation(transaction, rule);
  }

  return violations;
}

module.exports = {
  addViolationExplanations,
};
