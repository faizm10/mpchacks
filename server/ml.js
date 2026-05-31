/**
 * ML Spending Prediction Module
 *
 * Uses linear regression on historical monthly spend data to:
 *  - Forecast next month's spend per department / employee
 *  - Score how anomalous an individual expense is (0–100 risk score)
 *  - Project when a department budget will be exhausted
 *
 * Accuracy improves automatically as more transaction data is recorded.
 * The spending history is persisted to data/spending_history.json and
 * rebuilt whenever new transactions are imported.
 */

const ss = require('simple-statistics');
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'data', 'spending_history.json');

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (_) {
    return { departments: {}, employees: {} };
  }
}

function saveHistory(history) {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// ─── Sync from real transactions ──────────────────────────────────────────────
// Called after transactions are imported. Aggregates spend by (entity, month)
// and persists so the models always reflect the latest data.

function syncFromTransactions(transactions) {
  const deptAgg = {};  // dept_name  → { "YYYY-MM": amount }
  const empAgg  = {};  // employeeId → { "YYYY-MM": amount }
  const catAgg  = {};  // category   → { "YYYY-MM": amount }

  for (const txn of transactions) {
    const amount = Number(txn.amount || 0);
    if (!amount || !txn.transactionDate) continue;

    const month = String(txn.transactionDate).slice(0, 7); // "YYYY-MM"

    if (txn.department) {
      if (!deptAgg[txn.department]) deptAgg[txn.department] = {};
      deptAgg[txn.department][month] = (deptAgg[txn.department][month] || 0) + amount;
    }

    if (txn.employeeId) {
      if (!empAgg[txn.employeeId]) empAgg[txn.employeeId] = {};
      empAgg[txn.employeeId][month] = (empAgg[txn.employeeId][month] || 0) + amount;
    }

    if (txn.category) {
      if (!catAgg[txn.category]) catAgg[txn.category] = {};
      catAgg[txn.category][month] = (catAgg[txn.category][month] || 0) + amount;
    }
  }

  // Convert aggregation maps to sorted arrays
  function toSeries(agg) {
    const out = {};
    for (const [key, months] of Object.entries(agg)) {
      out[key] = Object.entries(months)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, spend]) => ({ month, spend: Math.round(spend * 100) / 100 }));
    }
    return out;
  }

  const history = {
    departments: toSeries(deptAgg),
    employees:   toSeries(empAgg),
    categories:  toSeries(catAgg),
  };

  saveHistory(history);
  return history;
}

// ─── Linear Regression helpers ────────────────────────────────────────────────

function fitModel(monthlyData) {
  if (!monthlyData || monthlyData.length < 2) return null;
  const pairs = monthlyData.map((d, i) => [i, d.spend]);
  const reg  = ss.linearRegression(pairs);
  const line = ss.linearRegressionLine(reg);
  const r2   = Math.max(0, ss.rSquared(pairs, line));
  return { slope: reg.m, intercept: reg.b, r2, predict: line };
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

function predictNextMonth(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) {
    return { predicted: 0, confidence: 0, trend: 'no_data', dataPoints: 0 };
  }

  const spends = monthlyData.map(d => d.spend);
  const mean   = ss.mean(spends);
  const model  = fitModel(monthlyData);

  if (!model) {
    return {
      predicted: Math.round(mean),
      confidence: 0,
      trend: 'insufficient_data',
      dataPoints: monthlyData.length,
    };
  }

  const predicted  = Math.max(0, Math.round(model.predict(monthlyData.length)));
  const confidence = Math.round(model.r2 * 100);
  const threshold  = mean * 0.02;
  const trend = model.slope > threshold  ? 'rising'
              : model.slope < -threshold ? 'falling'
              : 'stable';

  return {
    predicted,
    confidence,
    trend,
    slope: Math.round(model.slope),
    dataPoints: monthlyData.length,
    // Rough estimate: R² > 0.7 typically kicks in around 6 data points
    monthsUntilHighConfidence: Math.max(0, 6 - monthlyData.length),
  };
}

// Predict when a department will exhaust its monthly budget
function predictBudgetExhaustion(monthlyData, monthlyBudget, spentThisMonth) {
  const remaining = monthlyBudget - spentThisMonth;
  if (remaining <= 0) return { monthsLeft: 0, projectedOverrun: Math.abs(remaining) };

  const forecast = predictNextMonth(monthlyData);
  if (!forecast.predicted) return { monthsLeft: null, projectedOverrun: 0 };

  const monthsLeft = remaining / forecast.predicted;
  return {
    monthsLeft: Math.round(monthsLeft * 10) / 10,
    projectedOverrun: monthsLeft < 1 ? Math.round(forecast.predicted - remaining) : 0,
    forecastedMonthlySpend: forecast.predicted,
  };
}

// ─── Risk / Anomaly Score ────────────────────────────────────────────────────
//
// Composite score (0–100) from three signals:
//
//   Signal 1 — Amount anomaly (50 %): how many std-devs is this expense
//     from the employee's typical monthly spend?
//     This is the core ML signal; accuracy grows with more data.
//
//   Signal 2 — Budget pressure (30 %): what fraction of remaining budget
//     does this single expense consume?
//
//   Signal 3 — Policy risk (20 %): how many active policy issues does
//     this transaction carry?
//
// Returns: { riskScore, riskLevel, breakdown }

function computeRiskScore({ expenseAmount, employeeMonthly, remainingBudget, policyIssueCount = 0 }) {
  // Signal 1: amount anomaly (ML-powered)
  let amountSignal = 30; // default when history is too short
  if (employeeMonthly && employeeMonthly.length >= 3) {
    const spends = employeeMonthly.map(d => d.spend);
    const mean   = ss.mean(spends);
    const std    = ss.standardDeviation(spends);

    if (std > 0) {
      const z = Math.abs(expenseAmount - mean) / std;
      // Curve: z=0→0, z=1→22, z=2→55, z=3→85, z=4+→100
      amountSignal = Math.min(100, Math.round(Math.pow(z, 1.6) * 22));
    } else {
      amountSignal = expenseAmount > mean * 1.5 ? 55 : 5;
    }
  }

  // Signal 2: budget pressure
  let budgetSignal = 0;
  const rb = Number(remainingBudget || 0);
  if (rb > 0) {
    budgetSignal = Math.min(100, Math.round((expenseAmount / rb) * 80));
  } else if (rb <= 0) {
    budgetSignal = 100;
  }

  // Signal 3: policy issues
  const policySignal = Math.min(100, (policyIssueCount || 0) * 25);

  const composite = Math.round(amountSignal * 0.5 + budgetSignal * 0.3 + policySignal * 0.2);
  const riskScore  = Math.min(100, Math.max(0, composite));
  const riskLevel  = riskScore >= 65 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

  return {
    riskScore,
    riskLevel,
    mlBreakdown: {
      amountAnomaly:   amountSignal,
      budgetPressure:  budgetSignal,
      policyRisk:      policySignal,
    },
  };
}

// ─── High-level helpers (used by routes) ─────────────────────────────────────

function getDepartmentForecast(departmentName) {
  const history = loadHistory();
  const data    = history.departments[departmentName] ?? [];
  return { department: departmentName, ...predictNextMonth(data), history: data };
}

function getCategoryForecast(categoryName) {
  const history = loadHistory();
  const data    = (history.categories ?? {})[categoryName] ?? [];
  return { category: categoryName, ...predictNextMonth(data), history: data };
}

function getEmployeeForecast(employeeId) {
  const history = loadHistory();
  const data    = history.employees[employeeId] ?? [];
  return { employeeId, ...predictNextMonth(data), history: data };
}

function getAllInsights(departments) {
  const history = loadHistory();
  return departments.map(dept => {
    const data     = history.departments[dept.name] ?? [];
    const forecast = predictNextMonth(data);
    const exhaustion = predictBudgetExhaustion(
      data,
      dept.monthlyBudget,
      data.length ? data[data.length - 1].spend : 0,
    );
    return { department: dept.name, monthlyBudget: dept.monthlyBudget, forecast, exhaustion };
  });
}

module.exports = {
  syncFromTransactions,
  predictNextMonth,
  predictBudgetExhaustion,
  computeRiskScore,
  getDepartmentForecast,
  getEmployeeForecast,
  getCategoryForecast,
  getAllInsights,
  loadHistory,
};
