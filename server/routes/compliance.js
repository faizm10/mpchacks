const express = require('express');
const { readJson, writeJson } = require('../services/fileStore');
const { scanTransactions } = require('../services/complianceService');
const { addViolationExplanations } = require('../services/violationExplanationService');

const router = express.Router();

router.post('/compliance/scan', async (_req, res) => {
  try {
    const transactions = readJson('data/transactions_enriched.json', []);
    const policyRules = readJson('data/policyRules.json', []);

    let violations = scanTransactions(transactions, policyRules);
    violations = await addViolationExplanations(violations, transactions, policyRules);

    writeJson('data/violations.json', violations);

    res.json({
      totalViolations: violations.length,
      violations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Compliance scan failed' });
  }
});

router.get('/compliance/repeat-offenders', (_req, res) => {
  const violations = readJson('data/violations.json', []);
  const counts = {};

  violations.forEach(v => {
    counts[v.employeeName] = (counts[v.employeeName] || 0) + 1;
  });

  const offenders = Object.entries(counts)
    .map(([employeeName, violationCount]) => ({ employeeName, violationCount }))
    .sort((a, b) => b.violationCount - a.violationCount);

  res.json(offenders);
});

module.exports = router;
