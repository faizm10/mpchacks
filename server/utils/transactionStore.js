const fs = require('fs');
const path = require('path');
const { normalizeTransaction } = require('../models/transactionModel');

const sampleTransactions = [
  {
    id: 'txn_001',
    employeeName: 'Sarah Ahmed',
    department: 'Marketing',
    merchant: 'Adobe',
    category: 'Software',
    amount: 420.0,
    date: '2026-02-14',
    description: 'Adobe Creative Cloud',
  },
  {
    id: 'txn_002',
    employeeName: 'Liam Wong',
    department: 'Marketing',
    merchant: 'HubSpot',
    category: 'Software',
    amount: 12200.0,
    date: '2026-02-18',
    description: 'HubSpot annual plan',
  },
  {
    id: 'txn_003',
    employeeName: 'Sarah Ahmed',
    department: 'Marketing',
    merchant: 'Canva',
    category: 'Software',
    amount: 5800.0,
    date: '2026-03-01',
    description: 'Canva enterprise seats',
  },
  {
    id: 'txn_004',
    employeeName: 'Nina Patel',
    department: 'Engineering',
    merchant: 'GitHub',
    category: 'Software',
    amount: 9300.0,
    date: '2026-02-20',
    description: 'GitHub enterprise',
  },
];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_e) {
    return null;
  }
}

function loadTransactions() {
  const outputPath = path.join(__dirname, '..', 'output', 'transactions.json');
  const dataPath = path.join(__dirname, '..', 'data', 'transactions.json');

  const raw = readJsonIfExists(outputPath) || readJsonIfExists(dataPath) || sampleTransactions;

  return raw.map((t, i) => normalizeTransaction(t, i));
}

module.exports = {
  loadTransactions,
};
