const fs = require('fs');

const TRIP_BREAK_DAYS = 3;

function toDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sumBy(list, selector) {
  return list.reduce((sum, item) => sum + Number(selector(item) || 0), 0);
}

function computeRiskLevel(anomalyCount, totalCad) {
  if (anomalyCount >= 3 || totalCad >= 10000) return 'high';
  if (anomalyCount >= 1 || totalCad >= 5000) return 'medium';
  return 'low';
}

const transactions = JSON.parse(fs.readFileSync('./output/transactions.json', 'utf8'));

const sorted = [...transactions].sort((a, b) => {
  if (a.card !== b.card) return String(a.card).localeCompare(String(b.card));
  return String(a.date).localeCompare(String(b.date));
});

const groups = [];
let current = [];

for (const tx of sorted) {
  if (current.length === 0) {
    current.push(tx);
    continue;
  }

  const prev = current[current.length - 1];
  const sameCard = String(prev.card) === String(tx.card);
  const dayGap = Math.abs((toDate(tx.date) - toDate(prev.date)) / 86400000);

  if (sameCard && dayGap <= TRIP_BREAK_DAYS) {
    current.push(tx);
  } else {
    groups.push(current);
    current = [tx];
  }
}
if (current.length) groups.push(current);

const trips = groups.map((group, idx) => {
  const tripId = `T${String(idx + 1).padStart(3, '0')}`;
  const dates = group.map(t => t.date).sort();
  const states = unique(group.map(t => t.state));
  const locations = unique(group.map(t => t.location_label || t.state || t.country));

  group.forEach(t => {
    t.trip_id = tripId;
  });

  const totalFuel = sumBy(group.filter(t => t.category === 'fuel'), t => t.amount_cad);
  const totalPermits = sumBy(group.filter(t => t.category === 'permit'), t => t.amount_cad);
  const totalRepairs = sumBy(group.filter(t => ['repair', 'tire', 'parts'].includes(t.category)), t => t.amount_cad);
  const totalCad = sumBy(group, t => t.amount_cad);
  const anomalyCount = group.filter(t => t.anomaly_flag).length;

  return {
    trip_id: tripId,
    start_date: dates[0] || null,
    end_date: dates[dates.length - 1] || null,
    origin: locations[0] || 'Unknown',
    destination: locations[locations.length - 1] || 'Unknown',
    route_summary: locations.join(' -> '),
    states_transited: states,
    transaction_ids: group.map(t => t.id),
    total_fuel_cad: Number(totalFuel.toFixed(2)),
    total_permits_cad: Number(totalPermits.toFixed(2)),
    total_repairs_cad: Number(totalRepairs.toFixed(2)),
    total_cad: Number(totalCad.toFixed(2)),
    anomaly_count: anomalyCount,
    risk_level: computeRiskLevel(anomalyCount, totalCad),
  };
});

fs.writeFileSync('./output/trips.json', JSON.stringify(trips, null, 2));
fs.writeFileSync('./output/transactions.json', JSON.stringify(transactions, null, 2));
console.log(`Reconstructed ${trips.length} trips`);
