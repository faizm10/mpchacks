const XLSX = require('xlsx');
const fs = require('fs');

const MCC_CATEGORY = {
  9399: 'permit', 5541: 'fuel', 5542: 'fuel',
  5532: 'tire',   7538: 'repair', 7542: 'wash',
  4816: 'online', 4784: 'toll',  5046: 'scale',
  5533: 'parts',  5085: 'parts', 5561: 'parts',
  4812: 'telecom', 7011: 'hotel', 3501: 'hotel',
  3502: 'hotel',  3516: 'hotel', 5812: 'food',
  5814: 'food',   5300: 'personal', 5661: 'personal',
  5947: 'personal', 6011: 'atm', 8220: 'permit',
  4214: 'permit',
};

const PERSONAL_MERCHANTS = [
  'SOFTMOC', 'SKIPTHEDISHES', 'L OCA GIFTCARD',
  'TLF*THE AWESOME BLOSSO', 'SHOPPERS DRUG MART',
  'DOLLARAMA', 'GOODWILL', 'DOLLAR TREE', 'COBS BREAD',
  'SXM*SIRIUSXM', 'APPLE.COM/BILL', 'LINKEDIN', 'ADOBE', 'AUDIBLE',
];

function excelDateToISO(serial) {
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  return date.toISOString().split('T')[0];
}

const wb = XLSX.readFile('./data/dummy_data__2_.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

const transactions = rows
  .filter(r => r['Debit or Credit'] === 'Debit')
  .filter(r => !String(r['Merchant Info DBA Name'] || '').includes('CWB EFT PAYMENT'))
  .map((r, i) => {
    const mcc = parseInt(r['Merchant Category Code']) || 0;
    const convRate = parseFloat(r['Conversion Rate']) || 0;
    const amount = parseFloat(r['Transaction Amount']) || 0;
    const isCad = convRate === 0;
    const merchantUpper = String(r['Merchant Info DBA Name'] || '').toUpperCase();
    const isPersonal = PERSONAL_MERCHANTS.some(p => merchantUpper.includes(p));

    return {
      id: i,
      date: excelDateToISO(r['Transaction Date']),
      merchant: r['Merchant Info DBA Name'] || '',
      description: r['Transaction Description'] || '',
      category: isPersonal ? 'personal' : (MCC_CATEGORY[mcc] || 'other'),
      amount_usd: isCad ? null : amount,
      amount_cad: isCad ? amount : parseFloat((amount * convRate).toFixed(2)),
      currency: isCad ? 'CAD' : 'USD',
      card: String(r['Transaction Code']),
      mcc,
      city: r['Merchant City'] || '',
      state: r['Merchant State/Province'] || '',
      country: r['Merchant Country'] || '',
      postal: r['Merchant Postal Code'] || '',
      lat: null,
      lng: null,
      anomaly_flag: false,
      anomaly_type: null,
      anomaly_reason: null,
      trip_id: null,
    };
  });

fs.writeFileSync('./output/transactions.json', JSON.stringify(transactions, null, 2));
console.log(`Parsed ${transactions.length} transactions`);
