const fs = require("fs");
const path = require("path");

const transactionsPath = path.join(__dirname, "..", "output", "transactions.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}. Run scripts/1_parse.js first.`);
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

function isCanadianCountry(country) {
  const normalized = normalizeUpper(country);
  return ["CA", "CAN", "CANADA"].includes(normalized);
}

function getRegion(state, country) {
  const cleanState = cleanText(state);
  const cleanCountry = cleanText(country);

  if (cleanState && cleanCountry) return `${cleanState}, ${cleanCountry}`;
  if (cleanState) return cleanState;
  if (cleanCountry) return cleanCountry;
  return "Unknown";
}

function getLocationLabel(city, state, country) {
  const parts = [cleanText(city), cleanText(state), cleanText(country)].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

function getMonth(date) {
  if (!date || typeof date !== "string") return null;
  return date.slice(0, 7);
}

function getISOWeek(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const tempDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = tempDate.getUTCDay() || 7;

  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  const week = String(weekNumber).padStart(2, "0");

  return `${tempDate.getUTCFullYear()}-W${week}`;
}

function getMerchantKey(merchant) {
  return normalizeUpper(merchant)
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDashboardLabel(transaction) {
  const merchant = cleanText(transaction.merchant) || "Unknown merchant";
  const category = cleanText(transaction.category) || "other";
  const amount = toNumber(transaction.amount_cad).toFixed(2);

  return `${merchant} — ${category} — $${amount} CAD`;
}

function enrichTransaction(transaction) {
  const amountCad = toNumber(transaction.amount_cad);

  return {
    ...transaction,

    region: getRegion(transaction.state, transaction.country),
    merchant_key: getMerchantKey(transaction.merchant),
    month: getMonth(transaction.date),
    week: getISOWeek(transaction.date),

    is_cross_border: transaction.country
      ? !isCanadianCountry(transaction.country)
      : false,

    is_high_value: amountCad >= 500,

    location_label: getLocationLabel(
      transaction.city,
      transaction.state,
      transaction.country
    ),

    dashboard_label: getDashboardLabel(transaction),
  };
}

function main() {
  const transactions = readJson(transactionsPath);

  if (!Array.isArray(transactions)) {
    throw new Error("transactions.json must contain an array of transactions.");
  }

  const enrichedTransactions = transactions.map(enrichTransaction);

  writeJson(transactionsPath, enrichedTransactions);

  console.log(`Enriched ${enrichedTransactions.length} transactions`);
}

main();