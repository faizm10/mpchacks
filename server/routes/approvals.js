const express = require('express');
const { readJson, writeJson } = require('../services/fileStore');
const { generateApprovalRequests } = require('../services/approvalService');

const router = express.Router();

router.post('/approvals/generate', async (_req, res) => {
  try {
    const transactions = readJson('data/transactions_enriched.json', []);
    const violations = readJson('data/violations.json', []);
    const departments = readJson('data/departments.json', []);

    const approvals = await generateApprovalRequests(transactions, violations, departments);
    writeJson('data/approvals.json', approvals);

    res.json({ totalApprovals: approvals.length, approvals });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to generate approvals' });
  }
});

router.get('/approvals', (_req, res) => {
  const approvals = readJson('data/approvals.json', []);
  res.json(approvals);
});

router.get('/approvals/:id', (req, res) => {
  const approvals = readJson('data/approvals.json', []);
  const approval = approvals.find(a => a.id === req.params.id);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  return res.json(approval);
});

router.post('/approvals/:id/decision', (req, res) => {
  const { decision, approverNote } = req.body || {};
  const approvals = readJson('data/approvals.json', []);
  const idx = approvals.findIndex(a => a.id === req.params.id);

  if (idx < 0) return res.status(404).json({ error: 'Approval not found' });
  if (!decision) return res.status(400).json({ error: 'decision is required' });

  approvals[idx].status = String(decision).toLowerCase();
  approvals[idx].approverNote = approverNote || '';
  approvals[idx].processedAt = new Date().toISOString();

  writeJson('data/approvals.json', approvals);
  return res.json(approvals[idx]);
});

module.exports = router;
