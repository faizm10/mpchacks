const express = require('express');
const { readJson, writeJson } = require('../services/fileStore');

const router = express.Router();

router.get('/violations', (req, res) => {
  const violations = readJson('data/violations.json', []);

  const filtered = violations.filter(v => {
    if (req.query.severity && v.severity !== req.query.severity) return false;
    if (req.query.status && v.status !== req.query.status) return false;
    if (req.query.employeeName && v.employeeName !== req.query.employeeName) return false;
    if (req.query.department && v.department !== req.query.department) return false;
    if (req.query.merchantName && v.merchantName !== req.query.merchantName) return false;
    return true;
  });

  res.json(filtered);
});

router.patch('/violations/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const violations = readJson('data/violations.json', []);
  const idx = violations.findIndex(v => v.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Violation not found' });

  violations[idx].status = status;
  violations[idx].updatedAt = new Date().toISOString();

  writeJson('data/violations.json', violations);
  return res.json(violations[idx]);
});

module.exports = router;
