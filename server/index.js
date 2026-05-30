require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Data ─────────────────────────────────────────────────────────────────────

const SAMPLE_TRANSACTIONS = [
  { id: 0,  date: '2025-09-05', merchant: 'FLYING J 550',            category: 'fuel',    amount_cad: 1287.40, currency: 'USD', state: 'ND', card: '3001', mcc: 5541, city: 'Minot',       country: 'USA', postal: '', description: '', lat: 48.23, lng: -101.29, anomaly_flag: false },
  { id: 1,  date: '2025-09-06', merchant: 'NDHP-E PERMIT',           category: 'permit',  amount_cad: 85.00,   currency: 'CAD', state: 'ND', card: '3001', mcc: 9399, city: 'Bismarck',    country: 'USA', postal: '', description: '', lat: 46.81, lng: -100.78, anomaly_flag: false },
  { id: 2,  date: '2025-09-08', merchant: 'PILOT 917',               category: 'fuel',    amount_cad: 1540.20, currency: 'USD', state: 'MT', card: '3001', mcc: 5541, city: 'Great Falls',  country: 'USA', postal: '', description: '', lat: 47.50, lng: -111.30, anomaly_flag: false },
  { id: 3,  date: '2025-09-09', merchant: 'SOFTMOC 8464 WHITBY ON',  category: 'personal',amount_cad: 176.39,  currency: 'CAD', state: 'ON', card: '3001', mcc: 5661, city: 'Whitby',      country: 'CAN', postal: 'L1N2C3', description: '', lat: 43.90, lng: -78.94, anomaly_flag: false },
  { id: 4,  date: '2025-09-09', merchant: 'PZG**MT DEPT TRANSPORT',  category: 'permit',  amount_cad: 112.00,  currency: 'CAD', state: 'MT', card: '3001', mcc: 9399, city: 'Helena',      country: 'USA', postal: '', description: '', lat: 46.60, lng: -112.02, anomaly_flag: false },
  { id: 5,  date: '2025-09-10', merchant: "LOVE'S #0789 INSIDE",     category: 'fuel',    amount_cad: 1398.75, currency: 'USD', state: 'MT', card: '3001', mcc: 5541, city: 'Shelby',      country: 'USA', postal: '', description: '', lat: 47.50, lng: -111.30, anomaly_flag: false },
  { id: 6,  date: '2025-09-11', merchant: 'SKIPDISHES WINNIPEG',     category: 'personal',amount_cad: 27.13,   currency: 'CAD', state: 'MB', card: '3001', mcc: 5812, city: 'Winnipeg',    country: 'CAN', postal: 'R3C0T8', description: '', lat: 49.90, lng: -97.14, anomaly_flag: false },
  { id: 7,  date: '2025-09-11', merchant: 'TLF*THE AWESOME BLOSSO',  category: 'personal',amount_cad: 150.09,  currency: 'CAD', state: 'AB', card: '3001', mcc: 5992, city: 'Edmonton',    country: 'CAN', postal: 'T5M4G5', description: '', lat: 53.54, lng: -113.49, anomaly_flag: false },
  { id: 8,  date: '2025-09-12', merchant: 'PETRO #339 SPOKANE',      category: 'fuel',    amount_cad: 920.50,  currency: 'USD', state: 'WA', card: '3001', mcc: 5541, city: 'Spokane',     country: 'USA', postal: '', description: '', lat: 47.67, lng: -117.41, anomaly_flag: false },
  { id: 9,  date: '2025-09-12', merchant: 'WSDOT COMMERCIAL VEHIC',  category: 'permit',  amount_cad: 2344.29, currency: 'USD', state: 'WA', card: '3001', mcc: 9399, city: 'Tumwater',    country: 'USA', postal: '98504', description: '', lat: 47.00, lng: -122.90, anomaly_flag: false },
  { id: 10, date: '2025-09-12', merchant: 'WSDOT COMMERCIAL VEHIC',  category: 'permit',  amount_cad: 1842.15, currency: 'USD', state: 'WA', card: '3001', mcc: 9399, city: 'Tumwater',    country: 'USA', postal: '98504', description: '', lat: 47.00, lng: -122.90, anomaly_flag: false },
  { id: 11, date: '2025-09-12', merchant: 'WSDOT COMMERCIAL VEHIC',  category: 'permit',  amount_cad: 2048.43, currency: 'USD', state: 'WA', card: '3001', mcc: 9399, city: 'Tumwater',    country: 'USA', postal: '98504', description: '', lat: 47.00, lng: -122.90, anomaly_flag: false },
  { id: 12, date: '2025-09-14', merchant: "LOVE'S #0448 INSIDE",     category: 'fuel',    amount_cad: 1102.30, currency: 'USD', state: 'WA', card: '3001', mcc: 5541, city: 'Tacoma',      country: 'USA', postal: '', description: '', lat: 47.25, lng: -122.44, anomaly_flag: false },
  { id: 13, date: '2025-09-15', merchant: 'AB TRANSP 403-340-5075',  category: 'permit',  amount_cad: 140.00,  currency: 'CAD', state: 'AB', card: '3001', mcc: 9399, city: 'Edmonton',    country: 'CAN', postal: '', description: '', lat: 53.54, lng: -113.49, anomaly_flag: false },
  { id: 14, date: '2025-09-20', merchant: 'L OCA GIFTCARD',          category: 'personal',amount_cad: 75.00,   currency: 'CAD', state: 'BC', card: '3001', mcc: 5947, city: 'Vancouver',   country: 'CAN', postal: 'V6B2M1', description: '', lat: 49.28, lng: -123.12, anomaly_flag: false },
  { id: 15, date: '2025-10-03', merchant: 'MNA*MICHELIN CANADA',     category: 'tire',    amount_cad: 51182.84,currency: 'CAD', state: 'QC', card: '3001', mcc: 5532, city: 'Montreal',    country: 'CAN', postal: 'H7T2P6', description: '', lat: 45.56, lng: -73.74, anomaly_flag: false },
  { id: 16, date: '2025-10-05', merchant: 'IOWA 80 TRUCKSTOP',       category: 'fuel',    amount_cad: 1420.80, currency: 'USD', state: 'IA', card: '3001', mcc: 5541, city: 'Walcott',     country: 'USA', postal: '', description: '', lat: 41.61, lng: -90.76, anomaly_flag: false },
  { id: 17, date: '2025-10-06', merchant: 'IA DOT MOTOR CARRIER S',  category: 'permit',  amount_cad: 75.00,   currency: 'USD', state: 'IA', card: '3001', mcc: 9399, city: 'Ames',        country: 'USA', postal: '', description: '', lat: 41.73, lng: -93.61, anomaly_flag: false },
  { id: 18, date: '2025-10-08', merchant: "LOVE'S #0337 INSIDE",     category: 'fuel',    amount_cad: 985.60,  currency: 'USD', state: 'MN', card: '3001', mcc: 5541, city: 'Albert Lea',  country: 'USA', postal: '', description: '', lat: 43.65, lng: -93.37, anomaly_flag: false },
  { id: 19, date: '2025-10-10', merchant: 'MNDOT OSOW PERMITS',      category: 'permit',  amount_cad: 90.00,   currency: 'USD', state: 'MN', card: '3001', mcc: 9399, city: 'St Paul',     country: 'USA', postal: '', description: '', lat: 44.95, lng: -93.10, anomaly_flag: false },
  { id: 20, date: '2025-10-12', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 612.44,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 21, date: '2025-10-12', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 498.20,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 22, date: '2025-10-12', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 521.10,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 23, date: '2025-10-15', merchant: 'FLYING J 725',            category: 'fuel',    amount_cad: 1530.90, currency: 'USD', state: 'TX', card: '3001', mcc: 5541, city: 'Houston',     country: 'USA', postal: '', description: '', lat: 29.74, lng: -94.97, anomaly_flag: false },
  { id: 24, date: '2025-10-16', merchant: 'TXDMV OS PERMIT TPE',     category: 'permit',  amount_cad: 130.00,  currency: 'USD', state: 'TX', card: '3001', mcc: 9399, city: 'Austin',      country: 'USA', postal: '', description: '', lat: 30.27, lng: -97.74, anomaly_flag: false },
  { id: 25, date: '2025-10-18', merchant: 'PILOT 1025',              category: 'fuel',    amount_cad: 1720.00, currency: 'USD', state: 'TX', card: '3001', mcc: 5541, city: 'Houston',     country: 'USA', postal: '', description: '', lat: 29.77, lng: -95.22, anomaly_flag: false },
  { id: 26, date: '2025-11-02', merchant: 'VCN*KANSASMVPERMIT',      category: 'permit',  amount_cad: 88.00,   currency: 'USD', state: 'KS', card: '3001', mcc: 9399, city: 'Topeka',      country: 'USA', postal: '', description: '', lat: 39.05, lng: -95.69, anomaly_flag: false },
  { id: 27, date: '2025-11-04', merchant: "LOVE'S #0655 INSIDE",     category: 'fuel',    amount_cad: 1180.60, currency: 'USD', state: 'KS', card: '3001', mcc: 5541, city: 'Dodge City',  country: 'USA', postal: '', description: '', lat: 38.47, lng: -100.90, anomaly_flag: false },
  { id: 28, date: '2025-11-06', merchant: 'HUSKY TRUCK WASH',        category: 'wash',    amount_cad: 85.00,   currency: 'CAD', state: 'AB', card: '3001', mcc: 7542, city: 'Edmonton',    country: 'CAN', postal: '', description: '', lat: 53.54, lng: -113.49, anomaly_flag: false },
  { id: 29, date: '2025-11-10', merchant: 'CENEX-FUOC OF CARPIO',    category: 'fuel',    amount_cad: 890.20,  currency: 'USD', state: 'ND', card: '3001', mcc: 5541, city: 'Carpio',      country: 'USA', postal: '', description: '', lat: 48.45, lng: -101.71, anomaly_flag: false },
  { id: 30, date: '2025-11-12', merchant: 'SD DEPT OF TRANS OPS',    category: 'permit',  amount_cad: 70.00,   currency: 'USD', state: 'SD', card: '3001', mcc: 9399, city: 'Pierre',      country: 'USA', postal: '', description: '', lat: 44.37, lng: -100.35, anomaly_flag: false },
  { id: 31, date: '2025-11-15', merchant: 'MARATHON 272195',         category: 'fuel',    amount_cad: 430.50,  currency: 'USD', state: 'SD', card: '3001', mcc: 5541, city: 'Watertown',   country: 'USA', postal: '', description: '', lat: 44.90, lng: -97.11, anomaly_flag: false },
  { id: 32, date: '2025-12-03', merchant: 'TDOT OSOW PERMITS',       category: 'permit',  amount_cad: 115.00,  currency: 'USD', state: 'TN', card: '3001', mcc: 9399, city: 'Nashville',   country: 'USA', postal: '', description: '', lat: 36.17, lng: -86.78, anomaly_flag: false },
  { id: 33, date: '2025-12-05', merchant: 'IOWA 80 TRUCKSTOP FU',    category: 'fuel',    amount_cad: 1310.00, currency: 'USD', state: 'IA', card: '3001', mcc: 5541, city: 'Walcott',     country: 'USA', postal: '', description: '', lat: 41.61, lng: -90.76, anomaly_flag: false },
  { id: 34, date: '2025-12-08', merchant: 'MCSD OSOW',               category: 'permit',  amount_cad: 95.00,   currency: 'USD', state: 'IN', card: '3001', mcc: 9399, city: 'Indianapolis',country: 'USA', postal: '', description: '', lat: 39.79, lng: -86.15, anomaly_flag: false },
  { id: 35, date: '2025-12-10', merchant: 'FLYING J 550',            category: 'fuel',    amount_cad: 1460.80, currency: 'USD', state: 'ND', card: '3001', mcc: 5541, city: 'Minot',       country: 'USA', postal: '', description: '', lat: 48.23, lng: -101.29, anomaly_flag: false },
  { id: 36, date: '2025-12-15', merchant: 'NORTH STAR TRUCK REPAIR', category: 'repair',  amount_cad: 3400.00, currency: 'CAD', state: 'AB', card: '3001', mcc: 7538, city: 'Edmonton',    country: 'CAN', postal: '', description: '', lat: 53.54, lng: -113.49, anomaly_flag: true  },
  { id: 37, date: '2026-01-06', merchant: 'MNA*MICHELIN CANADA',     category: 'tire',    amount_cad: 1850.00, currency: 'CAD', state: 'QC', card: '3001', mcc: 5532, city: 'Montreal',    country: 'CAN', postal: '', description: '', lat: 45.56, lng: -73.74, anomaly_flag: false },
  { id: 38, date: '2026-01-08', merchant: 'BC PERMIT CENTRE',        category: 'permit',  amount_cad: 160.00,  currency: 'CAD', state: 'BC', card: '3001', mcc: 9399, city: 'Victoria',    country: 'CAN', postal: '', description: '', lat: 48.43, lng: -123.37, anomaly_flag: false },
  { id: 39, date: '2026-01-12', merchant: "LOVE'S #0772 INSIDE",     category: 'fuel',    amount_cad: 1075.20, currency: 'USD', state: 'NY', card: '3001', mcc: 5541, city: 'Corning',     country: 'USA', postal: '', description: '', lat: 42.34, lng: -77.32, anomaly_flag: false },
  { id: 40, date: '2026-01-15', merchant: 'PHILLIPS 66 - VALENTIN',  category: 'fuel',    amount_cad: 640.00,  currency: 'USD', state: 'NE', card: '3001', mcc: 5541, city: 'Valentine',   country: 'USA', postal: '', description: '', lat: 42.88, lng: -100.55, anomaly_flag: false },
  { id: 41, date: '2026-01-18', merchant: 'ILLINOIS DEPARTMENT OF',  category: 'permit',  amount_cad: 80.00,   currency: 'USD', state: 'IL', card: '3001', mcc: 9399, city: 'Springfield', country: 'USA', postal: '', description: '', lat: 39.80, lng: -89.65, anomaly_flag: false },
  { id: 42, date: '2026-02-03', merchant: 'CASEYS #3364',            category: 'fuel',    amount_cad: 510.30,  currency: 'USD', state: 'ND', card: '3001', mcc: 5541, city: 'Jamestown',   country: 'USA', postal: '', description: '', lat: 47.45, lng: -99.13, anomaly_flag: false },
  { id: 43, date: '2026-02-05', merchant: 'VCN*IDAHODOT',            category: 'permit',  amount_cad: 105.00,  currency: 'USD', state: 'ID', card: '3001', mcc: 9399, city: 'Boise',       country: 'USA', postal: '', description: '', lat: 43.62, lng: -116.20, anomaly_flag: false },
  { id: 44, date: '2026-02-08', merchant: 'OKC SIZE & WEIGHTS PER',  category: 'permit',  amount_cad: 92.00,   currency: 'USD', state: 'OK', card: '3001', mcc: 9399, city: 'Oklahoma City',country: 'USA', postal: '', description: '', lat: 35.47, lng: -97.52, anomaly_flag: false },
  { id: 45, date: '2026-02-10', merchant: 'PILOT 1103',              category: 'fuel',    amount_cad: 1590.60, currency: 'USD', state: 'WA', card: '3001', mcc: 5541, city: 'Burlington',  country: 'USA', postal: '', description: '', lat: 48.16, lng: -122.19, anomaly_flag: false },
  { id: 46, date: '2026-02-24', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 528.55,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 47, date: '2026-02-24', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 487.22,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 48, date: '2026-02-24', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 611.93,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 49, date: '2026-02-24', merchant: 'KWIK TRIP #234',          category: 'fuel',    amount_cad: 426.93,  currency: 'USD', state: 'WI', card: '3001', mcc: 5541, city: 'La Crosse',   country: 'USA', postal: '', description: '', lat: 43.82, lng: -91.24, anomaly_flag: false },
  { id: 50, date: '2026-03-03', merchant: 'WSDOT COMMERCIAL VEHIC',  category: 'permit',  amount_cad: 2344.29, currency: 'USD', state: 'WA', card: '3001', mcc: 9399, city: 'Tumwater',    country: 'USA', postal: '98504', description: '', lat: 47.00, lng: -122.90, anomaly_flag: false },
  { id: 51, date: '2026-03-03', merchant: 'WSDOT COMMERCIAL VEHIC',  category: 'permit',  amount_cad: 1842.15, currency: 'USD', state: 'WA', card: '3001', mcc: 9399, city: 'Tumwater',    country: 'USA', postal: '98504', description: '', lat: 47.00, lng: -122.90, anomaly_flag: false },
  { id: 52, date: '2026-03-03', merchant: 'WSDOT COMMERCIAL VEHIC',  category: 'permit',  amount_cad: 2048.43, currency: 'USD', state: 'WA', card: '3001', mcc: 9399, city: 'Tumwater',    country: 'USA', postal: '98504', description: '', lat: 47.00, lng: -122.90, anomaly_flag: false },
  { id: 53, date: '2026-03-05', merchant: 'PILOT 1103',              category: 'fuel',    amount_cad: 1590.60, currency: 'USD', state: 'WA', card: '3001', mcc: 5541, city: 'Burlington',  country: 'USA', postal: '', description: '', lat: 48.16, lng: -122.19, anomaly_flag: false },
];

function loadTransactions() {
  const file = path.join(__dirname, 'output', 'transactions.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : SAMPLE_TRANSACTIONS;
}

// ─── Category mappings ────────────────────────────────────────────────────────

const CAT_DISPLAY = {
  fuel: 'Fuel', permit: 'Permits', toll: 'Tolls', repair: 'Repairs',
  tire: 'Tires / Parts', parts: 'Tires / Parts', wash: 'Car Wash',
  hotel: 'Lodging', food: 'Meals', personal: 'Personal',
  online: 'Online / Amazon', atm: 'ATM', telecom: 'Telecom',
  scale: 'Scale', other: 'Other',
};

const CAT_COLORS = {
  'Fuel': '#378ADD', 'Permits': '#BA7517', 'Tires / Parts': '#7F77DD',
  'Repairs': '#888780', 'Car Wash': '#5DCAA5', 'Tolls': '#AFA9EC',
  'Online / Amazon': '#85B7EB', 'Lodging': '#10b981', 'Meals': '#84cc16',
  'Personal': '#D85A30', 'ATM': '#fb7185', 'Telecom': '#38bdf8',
  'Scale': '#a78bfa', 'Other': '#555',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapTransaction(t) {
  return {
    id: String(t.id),
    merchantName: t.merchant,
    amount: t.amount_cad,
    city: t.city || '',
    state: t.state || '',
    country: t.country || '',
    mcc: String(t.mcc || ''),
    transactionDate: t.date,
    postingDate: t.date,
    debitCredit: 'Debit',
    description: t.description || t.merchant,
    category: CAT_DISPLAY[t.category] || 'Other',
    transactionCode: String(t.card || ''),
    postalCode: t.postal || '',
    conversionRate: t.currency === 'CAD' ? 0 : 1,
  };
}

// ─── Derived: Spend Summary ───────────────────────────────────────────────────

function deriveSpendSummary(txns) {
  const totalSpend = txns.reduce((s, t) => s + (t.amount_cad || 0), 0);

  const catMap = {};
  txns.forEach(t => {
    const label = CAT_DISPLAY[t.category] || 'Other';
    catMap[label] = (catMap[label] || 0) + (t.amount_cad || 0);
  });
  const categoryBreakdown = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount: round2(amount), color: CAT_COLORS[category] || '#555' }));

  const monthMap = {};
  txns.forEach(t => {
    const [year, month] = t.date.split('-');
    const key = `${year}-${month}`;
    monthMap[key] = (monthMap[key] || 0) + (t.amount_cad || 0);
  });
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => {
      const [year, mon] = key.split('-');
      return { month: `${MONTHS[+mon - 1]} ${year}`, amount: Math.round(amount) };
    });

  const merchantMap = {};
  txns.forEach(t => {
    if (!merchantMap[t.merchant]) merchantMap[t.merchant] = { amount: 0, count: 0 };
    merchantMap[t.merchant].amount += (t.amount_cad || 0);
    merchantMap[t.merchant].count++;
  });
  const topMerchants = Object.entries(merchantMap)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 8)
    .map(([name, d]) => ({ name, amount: round2(d.amount), count: d.count }));

  const openViolations = txns.filter(t => t.category === 'personal' || t.anomaly_flag).length;
  const pendingApprovals = txns.filter(t => (t.amount_cad || 0) > 5000 && t.category !== 'personal').length;

  return {
    totalSpend: round2(totalSpend),
    transactionCount: txns.length,
    avgTransaction: txns.length ? round2(totalSpend / txns.length) : 0,
    openViolations,
    pendingApprovals,
    categoryBreakdown,
    monthlyTrend,
    topMerchants,
  };
}

// ─── Derived: Violations ──────────────────────────────────────────────────────

function deriveViolations(txns) {
  const violations = [];

  // Personal expenses
  txns.filter(t => t.category === 'personal').forEach(t => {
    violations.push({
      id: `v-personal-${t.id}`,
      type: 'personal_expense',
      severity: 'high',
      merchantName: t.merchant,
      amount: t.amount_cad,
      date: t.date,
      cardNumber: String(t.card),
      reason: `Personal expense on a corporate fleet card. Personal charges are not a reimbursable business expense.`,
      policyRule: 'Use of corporate credit cards to charge personal expenses is prohibited.',
      transaction: mapTransaction(t),
      transactionId: String(t.id),
    });
  });

  // Split charges: same merchant + card + date, >1 transaction
  const groups = {};
  txns.forEach(t => {
    const key = `${t.merchant}|${t.date}|${t.card}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length < 2) return;
    const total = group.reduce((s, t) => s + (t.amount_cad || 0), 0);
    if (total < 200) return;
    const [merchant] = key.split('|');
    violations.push({
      id: `v-split-${group[0].id}`,
      type: 'split_charge',
      severity: total > 1000 ? 'high' : 'medium',
      merchantName: merchant,
      amount: round2(total),
      date: group[0].date,
      cardNumber: String(group[0].card),
      reason: `${group.length} charges from the same merchant totalling $${total.toFixed(2)} on a single day — pattern consistent with splitting to avoid the pre-authorization threshold.`,
      policyRule: 'All expenses over $50 must be pre-authorized by your manager.',
      transaction: mapTransaction(group[0]),
      relatedTransactions: group.slice(1).map(mapTransaction),
      transactionId: String(group[0].id),
    });
  });

  return violations;
}

// ─── Derived: Approvals ───────────────────────────────────────────────────────

function deriveApprovals(txns) {
  return txns
    .filter(t => (t.amount_cad || 0) > 5000 && t.category !== 'personal')
    .slice(0, 5)
    .map(t => ({
      id: `a-${t.id}`,
      status: 'pending',
      requestedAt: t.date,
      aiRecommendation: 'review',
      aiReasoning: `Large ${CAT_DISPLAY[t.category] || t.category} charge of $${t.amount_cad.toFixed(2)} CAD on card ${t.card}. Exceeds the $50 pre-authorization threshold. Verify receipt before approving.`,
      departmentBudget: { used: 0, total: 500000, remaining: 500000, period: 'Current period' },
      transaction: mapTransaction(t),
      employeeHistory: [],
    }));
}

// ─── Derived: Trips ───────────────────────────────────────────────────────────

function deriveTrips(txns) {
  if (!txns.length) return [];
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  const runs = [];
  let current = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = (new Date(sorted[i].date) - new Date(current[current.length - 1].date)) / 86400000;
    if (gap > 4) { runs.push(current); current = [sorted[i]]; }
    else current.push(sorted[i]);
  }
  runs.push(current);

  return runs.map((group, idx) => {
    const total = group.reduce((s, t) => s + (t.amount_cad || 0), 0);
    const states = [...new Set(group.map(t => t.state).filter(Boolean))];
    const catMap = {};
    group.forEach(t => {
      const label = CAT_DISPLAY[t.category] || 'Other';
      catMap[label] = (catMap[label] || 0) + (t.amount_cad || 0);
    });
    const categoryBreakdown = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount: round2(amount), percentage: Math.round(amount / total * 100) }));

    return {
      id: `trip${idx + 1}`,
      name: states.length > 1 ? `${states[0]} → ${states[states.length - 1]} run` : `${states[0] || 'Unknown'} run`,
      startLocation: group[0].state || 'Unknown',
      endLocation: group[group.length - 1].state || 'Unknown',
      startDate: group[0].date,
      endDate: group[group.length - 1].date,
      totalSpend: round2(total),
      transactionCount: group.length,
      cardNumber: String(group[0].card || 'Unknown'),
      policyStatus: group.some(t => t.category === 'personal' || t.anomaly_flag) ? 'violations' : 'compliant',
      aiSummary: `${group.length} transactions across ${states.join(', ')}. Total spend $${total.toFixed(2)} CAD.`,
      categoryBreakdown,
      transactions: group.map(mapTransaction),
    };
  });
}

// ─── Derived: Inbox ───────────────────────────────────────────────────────────

function deriveInbox(violations, txns) {
  const items = violations.map(v => ({
    id: `i-${v.id}`,
    type: 'violation',
    severity: v.severity,
    isRead: false,
    isResolved: false,
    title: v.merchantName,
    subtitle: `${v.type.replace('_', ' ')} · Card ${v.cardNumber}`,
    amount: v.amount,
    date: v.date,
    aiBrief: v.reason,
    cardNumber: v.cardNumber,
    violation: v,
  }));

  deriveApprovals(txns).forEach(a => {
    items.push({
      id: `i-${a.id}`,
      type: 'approval',
      isRead: false,
      isResolved: false,
      title: a.transaction.merchantName,
      subtitle: `Approval needed · over threshold · Card ${a.transaction.transactionCode}`,
      amount: a.transaction.amount,
      date: a.requestedAt,
      aiBrief: a.aiReasoning,
      cardNumber: a.transaction.transactionCode,
      approval: a,
    });
  });

  return items.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function round2(n) { return Math.round(n * 100) / 100; }

// ─── Policy rules (in-memory, supports PATCH toggle) ─────────────────────────

const policyRules = [
  { id: 'p1', title: 'Pre-authorization threshold', description: 'All expenses over $50.00 must be pre-authorized by your manager and receipts are required before any expense is reimbursed.', category: 'Approval', threshold: 50, thresholdUnit: 'CAD', isActive: true, extractedFrom: 'Business Expenses — General Policy', severity: 'high' },
  { id: 'p2', title: 'No personal charges on corporate cards', description: 'Use of corporate credit cards to charge personal expenses is prohibited. Brim may choose to restrict usage or revoke corporate cards where consistent abuse is evident.', category: 'Corporate Cards', isActive: true, extractedFrom: 'Corporate Credit Cards', severity: 'high' },
  { id: 'p3', title: 'Alcohol restriction', description: 'Unless dining with a customer, expensing alcoholic beverages is not permitted. Names of guests and purpose must be listed with receipts for supplier entertainment.', category: 'Entertainment', isActive: true, extractedFrom: 'Business Travel — Supplier Entertainment', severity: 'medium' },
  { id: 'p4', title: 'Meal tip limit', description: 'Tips may be expensed up to 15% for services and porterage. Meal tips are included with meal claims and will not be reimbursed above 20%.', category: 'Meals', threshold: 20, thresholdUnit: '%', isActive: true, extractedFrom: 'Business Travel — Tips & Gratuities', severity: 'low' },
  { id: 'p5', title: 'Receipt submission deadline', description: 'You should use best efforts to submit receipts within the current month. Abuse of this policy including falsifying expense reports is expressly prohibited.', category: 'Receipts', isActive: true, extractedFrom: 'Business Expenses — General Policy', severity: 'medium' },
  { id: 'p6', title: 'Car rental sharing', description: 'If there are multiple company team members at the same location, you may be required to share a car. Car rental, parking and gasoline receipts are required for reimbursement.', category: 'Transportation', isActive: true, extractedFrom: 'Business Travel — Car Rental', severity: 'low' },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/spend/summary', (req, res) => {
  const txns = loadTransactions();
  res.json(txns.length ? deriveSpendSummary(txns) : null);
});

app.get('/violations', (req, res) => {
  res.json(deriveViolations(loadTransactions()));
});

app.post('/violations/scan', (req, res) => {
  res.json(deriveViolations(loadTransactions()));
});

app.get('/approvals', (req, res) => {
  res.json(deriveApprovals(loadTransactions()));
});

app.post('/approvals/:id/approve', (req, res) => res.json({ success: true }));
app.post('/approvals/:id/deny', (req, res) => res.json({ success: true }));

app.get('/trips', (req, res) => {
  res.json(deriveTrips(loadTransactions()));
});

app.get('/inbox', (req, res) => {
  const txns = loadTransactions();
  res.json(deriveInbox(deriveViolations(txns), txns));
});

app.post('/inbox/:id/resolve', (req, res) => res.json({ success: true }));

app.get('/policy/rules', (req, res) => res.json(policyRules));

app.patch('/policy/rules/:id', (req, res) => {
  const rule = policyRules.find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Not found' });
  if (typeof req.body.isActive === 'boolean') rule.isActive = req.body.isActive;
  res.json(rule);
});

// ─── Chat (Gemini) ────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const txns = loadTransactions();
  const summary = txns.length ? deriveSpendSummary(txns) : null;
  const violations = deriveViolations(txns);

  const systemPrompt = `You are TrailBlazer, an AI expense intelligence assistant for a trucking fleet company.
Fleet data summary:
- Total spend: ${summary ? `$${summary.totalSpend.toFixed(2)} CAD` : 'No transaction data loaded yet'}
- Transactions: ${summary?.transactionCount ?? 0}
- Open violations: ${violations.length}
- Category breakdown: ${summary ? summary.categoryBreakdown.map(c => `${c.category} $${c.amount.toFixed(0)}`).join(', ') : 'N/A'}
- Top merchants: ${summary ? summary.topMerchants.slice(0, 5).map(m => `${m.name} ($${m.amount.toFixed(0)}, ${m.count} txns)`).join(', ') : 'N/A'}

Answer questions about fleet expenses concisely. Use markdown for formatting. Reference amounts in CAD.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chatHistory = history
      .filter(m => m.content && !m.isLoading)
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am TrailBlazer, ready to help analyze your fleet expenses.' }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    res.json({ content: result.response.text() });
  } catch (err) {
    console.error('Gemini error:', err.message);
    // Return a graceful fallback rather than a 500 so the UI doesn't break
    res.json({ content: 'AI chat is currently unavailable — check that `GEMINI_API_KEY` is set in `.env.local` at the repo root.' });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(8000, () => console.log('TrailBlazer API → http://localhost:8000'));
