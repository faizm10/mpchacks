const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const CANDIDATE_INPUTS = [
  path.join(__dirname, '..', '..', 'data', 'dummy_data (2).xlsx'),
  path.join(__dirname, '..', 'data', 'dummy_data__2_.xlsx'),
  path.join(__dirname, '..', '..', 'data', 'dummy_data__2_.xlsx'),
];

function findInputFile() {
  return CANDIDATE_INPUTS.find(p => fs.existsSync(p));
}

function excelDateToISO(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return date.toISOString().split('T')[0];
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeRow(row, index) {
  return {
    id: `txn_${String(index + 1).padStart(3, '0')}`,
    transactionCode: String(row['Transaction Code'] || '').trim(),
    description: String(row['Transaction Description'] || '').trim(),
    rawCategory: String(row['Transaction Category'] || '').trim(),
    category: String(row['Transaction Category'] || '').trim() || 'Uncategorized',
    merchantName: String(row['Merchant Info DBA Name'] || '').trim(),
    amount: toNumber(row['Transaction Amount']),
    debitOrCredit: String(row['Debit or Credit'] || '').trim(),
    transactionDate: excelDateToISO(row['Transaction Date']),
    postingDate: excelDateToISO(row['Posting date of transaction']),
    merchantCategoryCode: String(row['Merchant Category Code'] || '').trim(),
    city: String(row['Merchant City'] || '').trim(),
    stateProvince: String(row['Merchant State/Province'] || '').trim(),
    country: String(row['Merchant Country'] || '').trim(),
    postalCode: String(row['Merchant Postal Code'] || '').trim(),
  };
}

function main() {
  const inputFile = findInputFile();
  if (!inputFile) {
    throw new Error(`Could not find input Excel file. Checked: ${CANDIDATE_INPUTS.join(', ')}`);
  }

  const workbook = XLSX.readFile(inputFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const transactions = rows
    .map(normalizeRow)
    .filter(txn => txn.debitOrCredit.toLowerCase() === 'debit')
    .filter(txn => !txn.merchantName.includes('CWB EFT PAYMENT'));

  const outputPath = path.join(__dirname, '..', 'data', 'transactions_raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2));

  console.log(`Parsed ${transactions.length} transactions into ${outputPath}`);
}

main();
