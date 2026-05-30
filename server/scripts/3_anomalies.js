const fs = require("fs");
const path = require("path");

const transactionsPath = path.join(__dirname, "..", "output", "transactions.json");
const anomaliesPath = path.join(__dirname, "..", "output", "anomalies.json");

const HIGH_VALUE_THRESHOLD_CAD = 1000;

const PERSONAL_KEYWORDS = [
  "SOFTMOC",
  "SKIPTHEDISHES",
  "GIFTCARD",
  "AWESOME BLOSSO",
  "SHOPPERS DRUG",
  "SHOPPERS DRUG MART",
  "DOLLARAMA",
  "GOODWILL",
  "DOLLAR TREE",
  "COBS BREAD",
  "SIRIUSXM",
  "APPLE.COM/BILL",
  "LINKEDIN",
  "ADOBE",
  "AUDIBLE",
];

const SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}. Run scripts/1_parse.js and scripts/2_enrich.js first.`);
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

function normalizeUpper(value) {
  return cleanText(value).toUpperCase();
}

function getDateMs(dateString) {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getMerchantKey(transaction) {
  if (transaction.merchant_key) return transaction.merchant_key;

  return normalizeUpper(transaction.merchant)
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldReplaceExistingSeverity(currentSeverity, newSeverity) {
  if (!currentSeverity) return true;
  return SEVERITY_RANK[newSeverity] > SEVERITY_RANK[currentSeverity];
}

function createAnomalyAdder(transactions, anomalies) {
  const seen = new Set();

  return function addAnomaly(transaction, anomalyType, anomalyReason, severity) {
    const key = `${transaction.id}|${anomalyType}`;

    if (seen.has(key)) return;
    seen.add(key);

    transaction.anomaly_flag = true;

    if (shouldReplaceExistingSeverity(transaction.anomaly_severity, severity)) {
      transaction.anomaly_type = anomalyType;
      transaction.anomaly_reason = anomalyReason;
      transaction.anomaly_severity = severity;
    }

    if (!Array.isArray(transaction.anomaly_types)) {
      transaction.anomaly_types = [];
    }

    if (!Array.isArray(transaction.anomaly_reasons)) {
      transaction.anomaly_reasons = [];
    }

    transaction.anomaly_types.push(anomalyType);
    transaction.anomaly_reasons.push(anomalyReason);

    anomalies.push({
      transaction_id: transaction.id,
      date: transaction.date,
      merchant: transaction.merchant,
      category: transaction.category,
      amount_cad: toNumber(transaction.amount_cad),
      card: transaction.card,
      city: transaction.city,
      state: transaction.state,
      country: transaction.country,
      anomaly_type: anomalyType,
      anomaly_reason: anomalyReason,
      severity,
    });
  };
}

function detectPersonalPurchases(transactions, addAnomaly) {
  transactions.forEach((transaction) => {
    const merchant = normalizeUpper(transaction.merchant);
    const category = normalizeUpper(transaction.category);

    const isPersonalCategory = category === "PERSONAL";
    const hasPersonalKeyword = PERSONAL_KEYWORDS.some((keyword) => merchant.includes(keyword));

    if (isPersonalCategory || hasPersonalKeyword) {
      addAnomaly(
        transaction,
        "personal_on_fleet",
        `${transaction.merchant} appears to be a personal purchase on a corporate fleet card.`,
        "high"
      );
    }
  });
}

function detectSameMerchantSameDay(transactions, addAnomaly) {
  const groups = new Map();

  transactions.forEach((transaction) => {
    const merchantKey = getMerchantKey(transaction);
    const date = cleanText(transaction.date);

    if (!merchantKey || !date) return;

    const key = `${merchantKey}|${date}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(transaction);
  });

  groups.forEach((group) => {
    if (group.length < 3) return;

    const merchant = group[0].merchant || "Unknown merchant";
    const date = group[0].date || "unknown date";
    const total = group.reduce((sum, transaction) => sum + toNumber(transaction.amount_cad), 0);

    group.forEach((transaction) => {
      addAnomaly(
        transaction,
        "duplicate_day",
        `${merchant} charged ${group.length} times on ${date}, totalling $${total.toFixed(2)} CAD.`,
        "medium"
      );
    });
  });
}

function detectExactDuplicateCharges(transactions, addAnomaly) {
  const groups = new Map();

  transactions.forEach((transaction) => {
    const merchantKey = getMerchantKey(transaction);
    const amount = toNumber(transaction.amount_cad).toFixed(2);

    if (!merchantKey || amount === "0.00") return;

    const key = `${merchantKey}|${amount}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(transaction);
  });

  groups.forEach((group) => {
    if (group.length < 2) return;

    const sorted = [...group].sort((a, b) => cleanText(a.date).localeCompare(cleanText(b.date)));

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const firstDate = getDateMs(sorted[i].date);
        const secondDate = getDateMs(sorted[j].date);

        if (firstDate === null || secondDate === null) continue;

        const diffDays = Math.abs(secondDate - firstDate) / 86400000;

        if (diffDays > 3) break;

        const amount = toNumber(sorted[i].amount_cad).toFixed(2);
        const merchant = sorted[i].merchant || "Unknown merchant";

        addAnomaly(
          sorted[i],
          "duplicate_charge",
          `Identical charge of $${amount} CAD at ${merchant} appears within 3 days.`,
          "high"
        );

        addAnomaly(
          sorted[j],
          "duplicate_charge",
          `Identical charge of $${amount} CAD at ${merchant} appears within 3 days.`,
          "high"
        );
      }
    }
  });
}

function detectHighValueTransactions(transactions, addAnomaly) {
  transactions.forEach((transaction) => {
    const amount = toNumber(transaction.amount_cad);

    if (amount >= HIGH_VALUE_THRESHOLD_CAD) {
      addAnomaly(
        transaction,
        "high_value_transaction",
        `$${amount.toFixed(2)} CAD is above the high-value review threshold of $${HIGH_VALUE_THRESHOLD_CAD.toFixed(2)} CAD.`,
        "medium"
      );
    }
  });
}

function detectStatisticalOutliers(transactions, addAnomaly) {
  const merchantGroups = new Map();

  transactions.forEach((transaction) => {
    const merchantKey = getMerchantKey(transaction);
    const amount = toNumber(transaction.amount_cad);

    if (!merchantKey || amount <= 0) return;

    if (!merchantGroups.has(merchantKey)) {
      merchantGroups.set(merchantKey, []);
    }

    merchantGroups.get(merchantKey).push(transaction);
  });

  merchantGroups.forEach((group) => {
    if (group.length < 5) return;

    const amounts = group.map((transaction) => toNumber(transaction.amount_cad));
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    const variance =
      amounts.reduce((sum, amount) => sum + (amount - mean) ** 2, 0) / amounts.length;

    const std = Math.sqrt(variance);

    if (std === 0) return;

    const threshold = mean + 3 * std;

    group.forEach((transaction) => {
      const amount = toNumber(transaction.amount_cad);

      if (amount > threshold) {
        addAnomaly(
          transaction,
          "statistical_outlier",
          `$${amount.toFixed(2)} CAD is unusually high for ${transaction.merchant}. Merchant average is $${mean.toFixed(2)} CAD.`,
          "high"
        );
      }
    });
  });
}

function resetAnomalyFields(transactions) {
  transactions.forEach((transaction) => {
    transaction.anomaly_flag = false;
    transaction.anomaly_type = null;
    transaction.anomaly_reason = null;
    transaction.anomaly_severity = null;
    transaction.anomaly_types = [];
    transaction.anomaly_reasons = [];
  });
}

function main() {
  const transactions = readJson(transactionsPath);

  if (!Array.isArray(transactions)) {
    throw new Error("transactions.json must contain an array of transactions.");
  }

  resetAnomalyFields(transactions);

  const anomalies = [];
  const addAnomaly = createAnomalyAdder(transactions, anomalies);

  detectPersonalPurchases(transactions, addAnomaly);
  detectSameMerchantSameDay(transactions, addAnomaly);
  detectExactDuplicateCharges(transactions, addAnomaly);
  detectHighValueTransactions(transactions, addAnomaly);
  detectStatisticalOutliers(transactions, addAnomaly);

  writeJson(transactionsPath, transactions);
  writeJson(anomaliesPath, anomalies);

  console.log(`Detected ${anomalies.length} anomalies`);
}

main();