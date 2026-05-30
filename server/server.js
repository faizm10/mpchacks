const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/data', express.static(path.join(__dirname, 'output')));

function readJson(fileName, fallback = []) {
  const fullPath = path.join(__dirname, 'output', fileName);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (_err) {
    return fallback;
  }
}

function parseBool(value) {
  if (value === undefined) return undefined;
  return String(value).toLowerCase() === 'true';
}

function parseNum(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function filterTransactions(transactions, filters = {}) {
  return transactions.filter(t => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.anomaly_only === true && !t.anomaly_flag) return false;
    if (filters.date_from && t.date < filters.date_from) return false;
    if (filters.date_to && t.date > filters.date_to) return false;
    if (filters.trip_id && String(t.trip_id || '') !== String(filters.trip_id)) return false;
    if (filters.min_amount !== undefined && Number(t.amount_cad || 0) < filters.min_amount) return false;
    if (filters.max_amount !== undefined && Number(t.amount_cad || 0) > filters.max_amount) return false;
    if (filters.state && String(t.state || '').toUpperCase() !== String(filters.state).toUpperCase()) return false;
    if (filters.country && String(t.country || '').toUpperCase() !== String(filters.country).toUpperCase()) return false;
    if (filters.merchant && !String(t.merchant || '').toUpperCase().includes(String(filters.merchant).toUpperCase())) return false;
    if (filters.card && String(t.card || '') !== String(filters.card)) return false;
    if (filters.severity) {
      const severityMatches = Array.isArray(filters.severity)
        ? filters.severity.includes((t.anomaly_severity || '').toLowerCase())
        : String(t.anomaly_severity || '').toLowerCase() === String(filters.severity).toLowerCase();
      if (!severityMatches) return false;
    }
    return true;
  });
}

function buildExpenseReport(trip, transactions, anomalies, verdicts) {
  if (!trip) {
    return '# Trip Expense Report\n\nTrip not found.';
  }

  const txById = new Map(transactions.map(t => [t.id, t]));
  const tripTx = trip.transaction_ids.map(id => txById.get(id)).filter(Boolean);
  const tripAnomalies = anomalies.filter(a => trip.transaction_ids.includes(a.transaction_id));
  const tripVerdicts = verdicts.filter(v => trip.transaction_ids.includes(v.transaction_id));

  const categoryTotals = {};
  for (const t of tripTx) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount_cad || 0);
  }

  const categoryRows = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => `- ${category}: $${total.toFixed(2)} CAD`)
    .join('\n');

  const anomalyRows = tripAnomalies.length
    ? tripAnomalies.map(a => `- [${a.severity || 'medium'}] ${a.anomaly_type}: ${a.anomaly_reason}`).join('\n')
    : '- None';

  const verdictRows = tripVerdicts.length
    ? tripVerdicts.map(v => `- ${v.action}: ${v.verdict}`).join('\n')
    : '- None';

  return [
    '# Trip Expense Report',
    '',
    `## Trip ${trip.trip_id}`,
    `- Date Range: ${trip.start_date} to ${trip.end_date}`,
    `- Route: ${trip.route_summary || `${trip.origin} -> ${trip.destination}`}`,
    `- Risk Level: ${trip.risk_level}`,
    `- Total Spend: $${Number(trip.total_cad || 0).toFixed(2)} CAD`,
    '',
    '## Category Breakdown',
    categoryRows || '- None',
    '',
    '## Anomalies',
    anomalyRows,
    '',
    '## Policy Concerns',
    verdictRows,
    '',
    `## Final Compliance Status`,
    tripAnomalies.length ? 'Review required before approval.' : 'No anomaly-driven blocker detected.',
  ].join('\n');
}

function inferDashboardQueryAction(query) {
  const q = String(query || '').toLowerCase();
  const filter = {
    category: null,
    anomaly_only: null,
    severity: null,
    date_from: null,
    date_to: null,
    trip_id: null,
    min_amount: null,
    max_amount: null,
    state: null,
    merchant: null,
  };

  let dashboard_action = 'show_summary';
  let target_component = 'overview_cards';
  let response_text = 'Showing dashboard summary.';

  if (q.includes('high-risk') || q.includes('high risk')) {
    filter.severity = 'high';
    filter.anomaly_only = true;
    dashboard_action = 'show_anomalies';
    target_component = 'anomaly_feed';
    response_text = 'Showing high-risk anomalies.';
  }

  if (q.includes('personal')) {
    filter.category = 'personal';
    filter.anomaly_only = true;
    dashboard_action = 'filter_table';
    target_component = 'transactions_table';
    response_text = 'Showing personal anomaly transactions.';
  }

  if (q.includes('fuel')) {
    filter.category = 'fuel';
    dashboard_action = 'show_category_breakdown';
    target_component = 'category_chart';
    response_text = 'Showing fuel spending breakdown.';
  }

  const amountMatch = q.match(/over\s*\$?\s*(\d+(?:\.\d+)?)/);
  if (amountMatch) {
    filter.min_amount = Number(amountMatch[1]);
    if (!response_text.includes('over')) {
      response_text = `Showing results over $${filter.min_amount}.`;
    }
  }

  const tripMatch = q.match(/trip\s+(t\d{3,})/i);
  if (tripMatch) {
    filter.trip_id = tripMatch[1].toUpperCase();
    dashboard_action = 'show_trip';
    target_component = 'trip_table';
    response_text = `Showing details for ${filter.trip_id}.`;
  }

  return { filter, dashboard_action, target_component, response_text };
}

app.get('/api/summary', (_req, res) => {
  const summary = readJson('dashboard_summary.json', {});
  res.json(summary);
});

app.get('/api/transactions', (req, res) => {
  const transactions = readJson('transactions.json', []);
  const filters = {
    category: req.query.category,
    anomaly_only: parseBool(req.query.anomaly_only),
    date_from: req.query.date_from,
    date_to: req.query.date_to,
    trip_id: req.query.trip_id,
    min_amount: parseNum(req.query.min_amount),
    max_amount: parseNum(req.query.max_amount),
    state: req.query.state,
    country: req.query.country,
    merchant: req.query.merchant,
    card: req.query.card,
  };

  res.json(filterTransactions(transactions, filters));
});

app.get('/api/anomalies', (req, res) => {
  const anomalies = readJson('anomalies.json', []);
  const transactions = readJson('transactions.json', []);
  const txById = new Map(transactions.map(t => [t.id, t]));

  let filtered = anomalies;

  if (req.query.severity) {
    filtered = filtered.filter(a => String(a.severity || '').toLowerCase() === String(req.query.severity).toLowerCase());
  }
  if (req.query.anomaly_type) {
    filtered = filtered.filter(a => a.anomaly_type === req.query.anomaly_type);
  }
  if (req.query.date_from) {
    filtered = filtered.filter(a => (txById.get(a.transaction_id)?.date || '') >= req.query.date_from);
  }
  if (req.query.date_to) {
    filtered = filtered.filter(a => (txById.get(a.transaction_id)?.date || '') <= req.query.date_to);
  }

  res.json(filtered);
});

app.get('/api/trips', (_req, res) => {
  res.json(readJson('trips.json', []));
});

app.get('/api/policy-verdicts', (_req, res) => {
  res.json(readJson('policy_verdicts.json', []));
});

app.post('/api/query', (req, res) => {
  const query = req.body?.query || '';
  const result = inferDashboardQueryAction(query);
  res.json(result);
});

app.post('/api/expense-report', (req, res) => {
  const tripId = String(req.body?.trip_id || '').toUpperCase();
  const trips = readJson('trips.json', []);
  const transactions = readJson('transactions.json', []);
  const anomalies = readJson('anomalies.json', []);
  const verdicts = readJson('policy_verdicts.json', []);

  const trip = trips.find(t => String(t.trip_id || '').toUpperCase() === tripId);
  const report = buildExpenseReport(trip, transactions, anomalies, verdicts);

  res.json({ report });
});

app.listen(PORT, () => {
  console.log(`TrailBlazer dashboard API running on port ${PORT}`);
});
