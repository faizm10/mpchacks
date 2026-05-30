const fs = require('fs');

function safeRead(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (_e) {
    return fallback;
  }
}

function round2(n) {
  return Number(Number(n || 0).toFixed(2));
}

function topNFromMap(obj, keyName, valueName, limit = 10) {
  return Object.entries(obj)
    .map(([key, val]) => ({ [keyName]: key, ...val }))
    .sort((a, b) => b[valueName] - a[valueName])
    .slice(0, limit);
}

const transactions = safeRead('./output/transactions.json', []);
const anomalies = safeRead('./output/anomalies.json', []);
const trips = safeRead('./output/trips.json', []);

const spendByCategory = {};
const spendByMonthMap = {};
const spendByRegion = {};
const merchantAgg = {};
const cardAgg = {};
const riskSummary = { low: 0, medium: 0, high: 0 };
const anomalyTypeCounts = {};

let totalSpend = 0;
let highestTx = null;

for (const t of transactions) {
  const amount = Number(t.amount_cad || 0);
  totalSpend += amount;

  if (!highestTx || amount > highestTx.amount_cad) {
    highestTx = {
      transaction_id: t.id,
      merchant: t.merchant,
      amount_cad: round2(amount),
    };
  }

  const category = t.category || 'other';
  spendByCategory[category] = round2((spendByCategory[category] || 0) + amount);

  const month = t.month || (t.date ? String(t.date).slice(0, 7) : 'unknown');
  spendByMonthMap[month] = round2((spendByMonthMap[month] || 0) + amount);

  const region = t.region || `${t.state || 'Unknown'}, ${t.country || 'Unknown'}`;
  spendByRegion[region] = round2((spendByRegion[region] || 0) + amount);

  if (!merchantAgg[t.merchant]) merchantAgg[t.merchant] = { total_cad: 0, transaction_count: 0 };
  merchantAgg[t.merchant].total_cad = round2(merchantAgg[t.merchant].total_cad + amount);
  merchantAgg[t.merchant].transaction_count += 1;

  const cardKey = String(t.card || 'unknown');
  if (!cardAgg[cardKey]) cardAgg[cardKey] = { total_cad: 0, transaction_count: 0 };
  cardAgg[cardKey].total_cad = round2(cardAgg[cardKey].total_cad + amount);
  cardAgg[cardKey].transaction_count += 1;
}

for (const a of anomalies) {
  const sev = (a.severity || 'medium').toLowerCase();
  if (riskSummary[sev] === undefined) riskSummary[sev] = 0;
  riskSummary[sev] += 1;

  const key = a.anomaly_type || 'unknown';
  anomalyTypeCounts[key] = (anomalyTypeCounts[key] || 0) + 1;
}

const spendByMonth = Object.entries(spendByMonthMap)
  .map(([month, total_cad]) => ({ month, total_cad: round2(total_cad) }))
  .sort((a, b) => a.month.localeCompare(b.month));

const mostCommonAnomalyType = Object.entries(anomalyTypeCounts)
  .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

const summary = {
  total_spend_cad: round2(totalSpend),
  transaction_count: transactions.length,
  anomaly_count: anomalies.length,
  high_risk_anomaly_count: riskSummary.high || 0,
  trip_count: trips.length,
  fuel_spend_cad: round2(spendByCategory.fuel || 0),
  permit_spend_cad: round2(spendByCategory.permit || 0),
  personal_spend_cad: round2(spendByCategory.personal || 0),
  average_transaction_cad: transactions.length ? round2(totalSpend / transactions.length) : 0,
  highest_transaction: highestTx || { transaction_id: null, merchant: null, amount_cad: 0 },
  spend_by_category: spendByCategory,
  spend_by_month: spendByMonth,
  spend_by_region: spendByRegion,
  top_merchants: topNFromMap(merchantAgg, 'merchant', 'total_cad', 10),
  top_cards: topNFromMap(cardAgg, 'card', 'total_cad', 10),
  risk_summary: riskSummary,
  most_common_anomaly_type: mostCommonAnomalyType,
};

fs.writeFileSync('./output/dashboard_summary.json', JSON.stringify(summary, null, 2));
console.log('Dashboard summary generated');
