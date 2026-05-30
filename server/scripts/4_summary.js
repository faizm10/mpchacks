const fs = require("fs");
const path = require("path");

const transactionsPath = path.join(__dirname, "..", "output", "transactions.json");
const anomaliesPath = path.join(__dirname, "..", "output", "anomalies.json");
const tripsPath = path.join(__dirname, "..", "output", "trips.json");
const summaryPath = path.join(__dirname, "..", "output", "dashboard_summary.json");

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function cleanText(value) {
  return String(value || "").trim();
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function addToGroup(map, key, amount) {
  const cleanKey = cleanText(key) || "Unknown";

  if (!map[cleanKey]) {
    map[cleanKey] = 0;
  }

  map[cleanKey] += toNumber(amount);
}

function incrementGroup(map, key) {
  const cleanKey = cleanText(key) || "Unknown";

  if (!map[cleanKey]) {
    map[cleanKey] = 0;
  }

  map[cleanKey] += 1;
}

function objectToSortedArray(object, keyName, valueName, limit = null) {
  const entries = Object.entries(object)
    .map(([key, value]) => ({
      [keyName]: key,
      [valueName]: roundMoney(value),
    }))
    .sort((a, b) => b[valueName] - a[valueName]);

  return limit ? entries.slice(0, limit) : entries;
}

function countObjectToSortedArray(object, keyName, valueName, limit = null) {
  const entries = Object.entries(object)
    .map(([key, value]) => ({
      [keyName]: key,
      [valueName]: value,
    }))
    .sort((a, b) => b[valueName] - a[valueName]);

  return limit ? entries.slice(0, limit) : entries;
}

function getMerchantKey(transaction) {
  return cleanText(transaction.merchant_key) || cleanText(transaction.merchant) || "Unknown merchant";
}

function buildTopMerchants(transactions, anomalies) {
  const merchantStats = {};

  transactions.forEach((transaction) => {
    const merchant = cleanText(transaction.merchant) || "Unknown merchant";
    const amount = toNumber(transaction.amount_cad);

    if (!merchantStats[merchant]) {
      merchantStats[merchant] = {
        merchant,
        total_cad: 0,
        transaction_count: 0,
        anomaly_count: 0,
      };
    }

    merchantStats[merchant].total_cad += amount;
    merchantStats[merchant].transaction_count += 1;
  });

  anomalies.forEach((anomaly) => {
    const merchant = cleanText(anomaly.merchant) || "Unknown merchant";

    if (merchantStats[merchant]) {
      merchantStats[merchant].anomaly_count += 1;
    }
  });

  return Object.values(merchantStats)
    .map((merchant) => ({
      ...merchant,
      total_cad: roundMoney(merchant.total_cad),
    }))
    .sort((a, b) => b.total_cad - a.total_cad)
    .slice(0, 10);
}

function buildTopCards(transactions) {
  const cardStats = {};

  transactions.forEach((transaction) => {
    const card = cleanText(transaction.card) || "Unknown card";
    const amount = toNumber(transaction.amount_cad);

    if (!cardStats[card]) {
      cardStats[card] = {
        card,
        total_cad: 0,
        transaction_count: 0,
      };
    }

    cardStats[card].total_cad += amount;
    cardStats[card].transaction_count += 1;
  });

  return Object.values(cardStats)
    .map((card) => ({
      ...card,
      total_cad: roundMoney(card.total_cad),
    }))
    .sort((a, b) => b.total_cad - a.total_cad)
    .slice(0, 10);
}

function getHighestTransaction(transactions) {
  if (transactions.length === 0) return null;

  const highest = transactions.reduce((max, transaction) => {
    return toNumber(transaction.amount_cad) > toNumber(max.amount_cad) ? transaction : max;
  }, transactions[0]);

  return {
    transaction_id: highest.id,
    date: highest.date,
    merchant: highest.merchant,
    category: highest.category,
    amount_cad: roundMoney(highest.amount_cad),
    card: highest.card,
    location_label: highest.location_label,
  };
}

function buildSummary(transactions, anomalies, trips) {
  const spendByCategory = {};
  const spendByMonth = {};
  const spendByRegion = {};
  const transactionCountByCategory = {};
  const riskSummary = {
    low: 0,
    medium: 0,
    high: 0,
  };
  const anomalyTypeSummary = {};

  let totalSpendCad = 0;
  let fuelSpendCad = 0;
  let permitSpendCad = 0;
  let repairSpendCad = 0;
  let personalSpendCad = 0;

  transactions.forEach((transaction) => {
    const amount = toNumber(transaction.amount_cad);
    const category = cleanText(transaction.category) || "other";

    totalSpendCad += amount;

    addToGroup(spendByCategory, category, amount);
    addToGroup(spendByMonth, transaction.month || cleanText(transaction.date).slice(0, 7), amount);
    addToGroup(spendByRegion, transaction.region, amount);
    incrementGroup(transactionCountByCategory, category);

    if (category === "fuel") fuelSpendCad += amount;
    if (category === "permit") permitSpendCad += amount;
    if (category === "repair" || category === "tire" || category === "parts") repairSpendCad += amount;
    if (category === "personal") personalSpendCad += amount;
  });

  anomalies.forEach((anomaly) => {
    const severity = cleanText(anomaly.severity).toLowerCase() || "low";
    const anomalyType = cleanText(anomaly.anomaly_type) || "unknown";

    if (!riskSummary[severity]) {
      riskSummary[severity] = 0;
    }

    riskSummary[severity] += 1;
    incrementGroup(anomalyTypeSummary, anomalyType);
  });

  const highRiskAnomalyCount = anomalies.filter(
    (anomaly) => cleanText(anomaly.severity).toLowerCase() === "high"
  ).length;

  const averageTransactionCad =
    transactions.length > 0 ? totalSpendCad / transactions.length : 0;

  return {
    generated_at: new Date().toISOString(),

    total_spend_cad: roundMoney(totalSpendCad),
    transaction_count: transactions.length,

    anomaly_count: anomalies.length,
    high_risk_anomaly_count: highRiskAnomalyCount,

    trip_count: Array.isArray(trips) ? trips.length : 0,

    fuel_spend_cad: roundMoney(fuelSpendCad),
    permit_spend_cad: roundMoney(permitSpendCad),
    repair_spend_cad: roundMoney(repairSpendCad),
    personal_spend_cad: roundMoney(personalSpendCad),

    average_transaction_cad: roundMoney(averageTransactionCad),
    highest_transaction: getHighestTransaction(transactions),

    spend_by_category: Object.fromEntries(
      Object.entries(spendByCategory).map(([key, value]) => [key, roundMoney(value)])
    ),

    spend_by_category_chart: objectToSortedArray(
      spendByCategory,
      "category",
      "total_cad"
    ),

    transaction_count_by_category: transactionCountByCategory,

    spend_by_month: Object.entries(spendByMonth)
      .map(([month, total]) => ({
        month,
        total_cad: roundMoney(total),
      }))
      .sort((a, b) => a.month.localeCompare(b.month)),

    spend_by_region: objectToSortedArray(
      spendByRegion,
      "region",
      "total_cad",
      15
    ),

    top_merchants: buildTopMerchants(transactions, anomalies),
    top_cards: buildTopCards(transactions),

    risk_summary: riskSummary,

    anomaly_type_summary: countObjectToSortedArray(
      anomalyTypeSummary,
      "anomaly_type",
      "count"
    ),
  };
}

function main() {
  const transactions = readJson(transactionsPath, []);
  const anomalies = readJson(anomaliesPath, []);
  const trips = readJson(tripsPath, []);

  if (!Array.isArray(transactions)) {
    throw new Error("transactions.json must contain an array.");
  }

  if (!Array.isArray(anomalies)) {
    throw new Error("anomalies.json must contain an array.");
  }

  const summary = buildSummary(transactions, anomalies, trips);

  writeJson(summaryPath, summary);

  console.log("Generated dashboard summary");
}

main();