const fs = require('fs');

const transactions = JSON.parse(fs.readFileSync('./output/transactions.json'));
const anomalies = [];

// Rule 1: Personal merchant on fleet card
const PERSONAL_KEYWORDS = [
  'SOFTMOC','SKIPTHEDISHES','GIFTCARD','AWESOME BLOSSO',
  'SHOPPERS DRUG','DOLLARAMA','GOODWILL','DOLLAR TREE',
  'COBS BREAD','SXM*SIRIUSXM','APPLE.COM/BILL','LINKEDIN','ADOBE','AUDIBLE'
];
transactions.forEach(t => {
  if (PERSONAL_KEYWORDS.some(k => t.merchant.toUpperCase().includes(k))) {
    t.anomaly_flag = true;
    t.anomaly_type = 'personal_on_fleet';
    t.anomaly_reason = `${t.merchant} appears to be a personal purchase on a corporate fleet card.`;
    anomalies.push({ transaction_id: t.id, anomaly_type: t.anomaly_type,
      anomaly_reason: t.anomaly_reason, severity: 'high', amount_cad: t.amount_cad });
  }
});

// Rule 2: Same merchant 3+ charges same day
const byMerchantDay = {};
transactions.forEach(t => {
  const key = `${t.merchant}|${t.date}`;
  if (!byMerchantDay[key]) byMerchantDay[key] = [];
  byMerchantDay[key].push(t);
});
Object.values(byMerchantDay).forEach(group => {
  if (group.length >= 3) {
    group.forEach(t => {
      t.anomaly_flag = true;
      t.anomaly_type = 'duplicate_day';
      t.anomaly_reason = `${t.merchant} charged ${group.length} times on ${t.date} totalling $${group.reduce((s,x)=>s+x.amount_cad,0).toFixed(2)} CAD.`;
      anomalies.push({ transaction_id: t.id, anomaly_type: t.anomaly_type,
        anomaly_reason: t.anomaly_reason, severity: 'medium', amount_cad: t.amount_cad });
    });
  }
});

// Rule 3: Statistical outlier — amount > mean + 3σ per merchant
const byMerchant = {};
transactions.forEach(t => {
  if (!byMerchant[t.merchant]) byMerchant[t.merchant] = [];
  byMerchant[t.merchant].push(t.amount_cad);
});
transactions.forEach(t => {
  const vals = byMerchant[t.merchant];
  if (vals.length < 3) return;
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const std = Math.sqrt(vals.map(v=>(v-mean)**2).reduce((a,b)=>a+b,0)/vals.length);
  if (t.amount_cad > mean + 3*std) {
    t.anomaly_flag = true;
    t.anomaly_type = 'statistical_outlier';
    t.anomaly_reason = `$${t.amount_cad.toFixed(2)} CAD is abnormally high for ${t.merchant} (avg: $${mean.toFixed(2)}).`;
    anomalies.push({ transaction_id: t.id, anomaly_type: t.anomaly_type,
      anomaly_reason: t.anomaly_reason, severity: 'high', amount_cad: t.amount_cad });
  }
});

// Rule 4: Exact duplicate amount same merchant within 3 days
transactions.forEach((t, i) => {
  const dupes = transactions.filter((t2, j) => j !== i
    && t2.merchant === t.merchant
    && t2.amount_cad === t.amount_cad
    && Math.abs(new Date(t2.date) - new Date(t.date)) <= 3 * 86400000
  );
  if (dupes.length > 0 && !t.anomaly_flag) {
    t.anomaly_flag = true;
    t.anomaly_type = 'duplicate_charge';
    t.anomaly_reason = `Identical charge of $${t.amount_cad} CAD at ${t.merchant} appears ${dupes.length+1} times within 3 days.`;
    anomalies.push({ transaction_id: t.id, anomaly_type: t.anomaly_type,
      anomaly_reason: t.anomaly_reason, severity: 'high', amount_cad: t.amount_cad });
  }
});

fs.writeFileSync('./output/transactions.json', JSON.stringify(transactions, null, 2));
fs.writeFileSync('./output/anomalies.json', JSON.stringify(anomalies, null, 2));
console.log(`Detected ${anomalies.length} anomalies`);
