const express = require('express');
const { readJson } = require('../services/fileStore');
const ml = require('../ml');

const router = express.Router();

// Sync spending history from the latest enriched transactions.
// Call this whenever new transactions are imported to keep the models fresh.
router.post('/ml/sync', (req, res) => {
  try {
    const transactions = readJson('data/transactions_enriched.json', []);
    if (!transactions.length) {
      return res.status(400).json({ error: 'No transactions found to sync from.' });
    }
    const history = ml.syncFromTransactions(transactions);
    const deptCount = Object.keys(history.departments).length;
    const empCount  = Object.keys(history.employees).length;
    res.json({
      synced: true,
      departments: deptCount,
      employees: empCount,
      message: `ML models updated from ${transactions.length} transactions across ${deptCount} departments and ${empCount} employees.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overall insights: forecast + budget exhaustion for every department.
router.get('/ml/insights', (req, res) => {
  try {
    const departments = readJson('data/departments.json', []);
    const insights = ml.getAllInsights(departments);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forecast for a single department.
router.get('/ml/predict/department/:name', (req, res) => {
  try {
    const forecast = ml.getDepartmentForecast(req.params.name);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forecast for a single employee.
router.get('/ml/predict/employee/:id', (req, res) => {
  try {
    const forecast = ml.getEmployeeForecast(req.params.id);
    res.json(forecast);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compute an ML risk score for an approval request on-the-fly.
// Body: { approvalId } — looks up the approval and runs the scoring model.
router.post('/ml/risk-score', (req, res) => {
  try {
    const { approvalId } = req.body || {};
    const approvals = readJson('data/approvals.json', []);
    const approval  = approvals.find(a => a.id === approvalId);
    if (!approval) return res.status(404).json({ error: 'Approval not found' });

    const empHistory = ml.getEmployeeForecast(approval.employeeId || '');
    const score = ml.computeRiskScore({
      expenseAmount:   approval.amount,
      employeeMonthly: empHistory.history,
      remainingBudget: approval.departmentBudgetRemaining,
      policyIssueCount: (approval.policyIssues || []).length,
    });
    res.json({ approvalId, ...score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full spending history snapshot (for debugging / frontend charts).
router.get('/ml/history', (_req, res) => {
  try {
    res.json(ml.loadHistory());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
