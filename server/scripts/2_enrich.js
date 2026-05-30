const fs = require('fs');

function getISOWeek(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

const HOME_COUNTRY_VALUES = new Set(['CAN', 'CA', 'CANADA']);
const transactions = JSON.parse(fs.readFileSync('./output/transactions.json', 'utf8'));

transactions.forEach(t => {
  const country = String(t.country || '').toUpperCase().trim();
  const category = String(t.category || 'other');
  const merchant = String(t.merchant || '').trim();
  const state = String(t.state || '').trim();
  const city = String(t.city || '').trim();

  t.region = `${state || 'Unknown'}, ${country || 'Unknown'}`;
  t.merchant_key = merchant.toUpperCase();
  t.month = t.date ? String(t.date).slice(0, 7) : null;
  t.week = getISOWeek(t.date);
  t.is_cross_border = !!country && !HOME_COUNTRY_VALUES.has(country);
  t.is_high_value = Number(t.amount_cad || 0) >= 500;
  t.location_label = [city, state].filter(Boolean).join(', ');
  t.dashboard_label = `${merchant} - ${category} - $${Number(t.amount_cad || 0).toFixed(2)} CAD`;
});

fs.writeFileSync('./output/transactions.json', JSON.stringify(transactions, null, 2));
console.log(`Enrichment complete for ${transactions.length} transactions`);
