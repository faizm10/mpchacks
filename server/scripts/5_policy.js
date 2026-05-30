const fs = require('fs');

function verdictForType(type, severity) {
  if (type === 'personal_on_fleet') {
    return {
      verdict: 'This appears to be a personal retail expense on a corporate fleet card and should be treated as non-compliant.',
      action: 'REJECT',
    };
  }

  if (type === 'duplicate_charge') {
    return {
      verdict: 'This looks like a duplicate merchant charge and should be reviewed for reimbursement or dispute.',
      action: 'REVIEW',
    };
  }

  if (type === 'duplicate_day') {
    return {
      verdict: 'Multiple same-day charges at the same merchant require review to confirm operational necessity.',
      action: 'REVIEW',
    };
  }

  if (type === 'statistical_outlier') {
    return {
      verdict: 'This amount is materially above normal merchant spend and should be reviewed with receipt support.',
      action: severity === 'high' ? 'REVIEW' : 'APPROVE',
    };
  }

  return {
    verdict: 'No clear policy breach was inferred from the anomaly type; confirm with supporting context.',
    action: 'REVIEW',
  };
}

const transactions = JSON.parse(fs.readFileSync('./output/transactions.json', 'utf8'));
const anomalies = JSON.parse(fs.readFileSync('./output/anomalies.json', 'utf8'));

const txById = new Map(transactions.map(t => [t.id, t]));

const verdicts = anomalies.map(a => {
  const tx = txById.get(a.transaction_id) || {};
  const severity = a.severity || (tx.anomaly_type === 'personal_on_fleet' ? 'high' : 'medium');
  const base = verdictForType(a.anomaly_type, severity);

  return {
    transaction_id: a.transaction_id,
    merchant: tx.merchant || '',
    amount_cad: Number(tx.amount_cad || a.amount_cad || 0),
    date: tx.date || null,
    anomaly_type: a.anomaly_type || tx.anomaly_type || 'unknown',
    severity,
    verdict: base.verdict,
    action: base.action,
  };
});

fs.writeFileSync('./output/policy_verdicts.json', JSON.stringify(verdicts, null, 2));
console.log(`Generated ${verdicts.length} policy verdicts`);
