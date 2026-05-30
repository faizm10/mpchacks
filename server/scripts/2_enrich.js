const fs = require('fs');
const path = require('path');

const categoryMap = {
  '5541': 'Fuel',
  '5542': 'Fuel',
  '4215': 'Shipping',
  '9399': 'Government / Permits',
  '7523': 'Parking',
  '5812': 'Meals',
  '5813': 'Alcohol / Bar',
  '5734': 'Software',
  '5045': 'Equipment',
};

const employees = [
  { id: 'emp_001', name: 'Sarah Ahmed', department: 'Operations' },
  { id: 'emp_002', name: 'Daniel Kim', department: 'Logistics' },
  { id: 'emp_003', name: 'Maya Chen', department: 'Finance' },
  { id: 'emp_004', name: 'Omar Khan', department: 'Sales' },
];

function seededBool(seed, threshold) {
  const hash = Array.from(String(seed)).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return (hash % 100) < threshold;
}

function inferCategory(txn) {
  const mcc = String(txn.merchantCategoryCode || '');
  if (categoryMap[mcc]) return categoryMap[mcc];

  const text = `${txn.rawCategory} ${txn.description} ${txn.merchantName}`.toLowerCase();
  if (text.includes('fuel')) return 'Fuel';
  if (text.includes('permit')) return 'Government / Permits';
  if (text.includes('hotel') || text.includes('travel')) return 'Travel';
  if (text.includes('meal') || text.includes('restaurant')) return 'Meals';
  if (text.includes('software') || text.includes('subscription')) return 'Software';
  return txn.rawCategory || 'Other';
}

function inferBusinessPurpose(category) {
  const map = {
    Fuel: 'Business travel',
    'Government / Permits': 'Operational permits and compliance',
    Travel: 'Client travel',
    Meals: 'Team or client meal',
    'Alcohol / Bar': 'Client entertainment',
    Software: 'Software tooling',
    Shipping: 'Business shipping',
    Equipment: 'Operational equipment',
    Parking: 'Business travel',
  };
  return map[category] || 'Business operations';
}

function assignEmployee(txn, index) {
  const key = txn.transactionCode || txn.id || index;
  const hash = Array.from(String(key)).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return employees[hash % employees.length];
}

function enrich(txn, index) {
  const employee = assignEmployee(txn, index);
  const category = inferCategory(txn);

  let preAuthorized = txn.amount > 50 ? seededBool(txn.id, 68) : true;
  let receiptAttached = seededBool(`${txn.id}-receipt`, 80);

  if (txn.amount > 50 && index % 9 === 0) preAuthorized = false;
  if (txn.amount > 50 && index % 7 === 0) receiptAttached = false;

  return {
    ...txn,
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    category,
    receiptAttached,
    preAuthorized,
    businessPurpose: inferBusinessPurpose(category),
    approvalStatus: txn.amount > 50 && !preAuthorized ? 'pending' : 'not_required',
  };
}

function main() {
  const inputPath = path.join(__dirname, '..', 'data', 'transactions_raw.json');
  const outputPath = path.join(__dirname, '..', 'data', 'transactions_enriched.json');

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const enriched = raw.map(enrich);

  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2));
  console.log(`Enriched ${enriched.length} transactions into ${outputPath}`);
}

main();
