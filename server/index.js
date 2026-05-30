require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  { id: 'emp-001', name: 'Sarah Chen',       initials: 'SC', department: 'Marketing',   role: 'Marketing Manager',    yearsAtCompany: 3 },
  { id: 'emp-002', name: 'Marcus Johnson',   initials: 'MJ', department: 'Engineering', role: 'Engineering Lead',     yearsAtCompany: 5 },
  { id: 'emp-003', name: 'David Park',       initials: 'DP', department: 'Finance',     role: 'Finance Analyst',      yearsAtCompany: 2 },
  { id: 'emp-004', name: 'Alex Rivera',      initials: 'AR', department: 'Sales',       role: 'Sales Representative', yearsAtCompany: 1 },
  { id: 'emp-005', name: 'Jessica Williams', initials: 'JW', department: 'Operations',  role: 'Operations Coordinator', yearsAtCompany: 4 },
  { id: 'emp-006', name: 'Tom Bradley',      initials: 'TB', department: 'Fleet',       role: 'Fleet Manager',        yearsAtCompany: 7 },
];

const DEPARTMENT_BUDGETS = {
  Marketing:   { total: 48000,  used: 8640,   period: 'Q2 2026' },
  Engineering: { total: 120000, used: 48000,  period: 'Q2 2026' },
  Finance:     { total: 18000,  used: 9900,   period: 'Q2 2026' },
  Sales:       { total: 60000,  used: 56700,  period: 'Q2 2026' },
  Operations:  { total: 32000,  used: 14200,  period: 'Q2 2026' },
  Fleet:       { total: 250000, used: 112000, period: 'Q2 2026' },
};

const EMPLOYEE_HISTORY = {
  'emp-001': {
    totalSpent90d: 4200,
    avgMonthlySpend: 1400,
    approvalsRequested12m: 3,
    approvalsApproved12m: 3,
    approvalsDenied12m: 0,
    flaggedTransactions: 0,
    commonCategories: ['Conferences & Events', 'Software & Subscriptions', 'Marketing Materials'],
    recentApprovals: [
      { description: 'HubSpot Marketing Summit', amount: 980,  category: 'Conference', decision: 'approved', date: '2026-02-14' },
      { description: 'Adobe Creative Suite Annual',amount: 660, category: 'Software',  decision: 'approved', date: '2026-01-08' },
      { description: 'Social Media Analytics Tool', amount: 420, category: 'Software', decision: 'approved', date: '2025-11-20' },
    ],
  },
  'emp-002': {
    totalSpent90d: 18400,
    avgMonthlySpend: 6133,
    approvalsRequested12m: 7,
    approvalsApproved12m: 6,
    approvalsDenied12m: 1,
    flaggedTransactions: 0,
    commonCategories: ['Cloud Services', 'Developer Tools', 'Training & Certifications'],
    recentApprovals: [
      { description: 'AWS Infrastructure Q1',   amount: 4200, category: 'Cloud Services', decision: 'approved', date: '2026-03-01' },
      { description: 'GitHub Enterprise (team)', amount: 1800, category: 'Software',       decision: 'approved', date: '2026-02-01' },
      { description: 'DataDog Monitoring',       amount: 2100, category: 'Cloud Services', decision: 'approved', date: '2026-01-15' },
    ],
  },
  'emp-003': {
    totalSpent90d: 1800,
    avgMonthlySpend: 600,
    approvalsRequested12m: 4,
    approvalsApproved12m: 3,
    approvalsDenied12m: 1,
    flaggedTransactions: 1,
    commonCategories: ['Meals', 'Office Supplies', 'Training'],
    recentApprovals: [
      { description: 'Financial Modeling Course', amount: 480, category: 'Training',   decision: 'approved', date: '2026-01-22' },
      { description: 'Team lunch (7 people)',      amount: 310, category: 'Meals',      decision: 'approved', date: '2026-03-10' },
      { description: 'Late night solo dinner',     amount: 185, category: 'Meals',      decision: 'denied',   date: '2025-12-18' },
    ],
  },
  'emp-004': {
    totalSpent90d: 9800,
    avgMonthlySpend: 3267,
    approvalsRequested12m: 12,
    approvalsApproved12m: 9,
    approvalsDenied12m: 3,
    flaggedTransactions: 2,
    commonCategories: ['Client Entertainment', 'Travel & Hotels', 'Conferences'],
    recentApprovals: [
      { description: 'Client dinner (Koi Restaurant)', amount: 620,  category: 'Client Entertainment', decision: 'approved', date: '2026-03-05' },
      { description: 'Chicago Sales Conference hotel',  amount: 1840, category: 'Hotel',               decision: 'approved', date: '2026-02-20' },
      { description: 'Client golf outing',              amount: 890,  category: 'Entertainment',        decision: 'denied',   date: '2026-01-14' },
    ],
  },
  'emp-005': {
    totalSpent90d: 3100,
    avgMonthlySpend: 1033,
    approvalsRequested12m: 5,
    approvalsApproved12m: 4,
    approvalsDenied12m: 1,
    flaggedTransactions: 0,
    commonCategories: ['Office Supplies', 'Courier & Shipping', 'Maintenance'],
    recentApprovals: [
      { description: 'Office printer cartridges',  amount: 240,  category: 'Office Supplies', decision: 'approved', date: '2026-02-28' },
      { description: 'Courier services (bulk)',     amount: 380,  category: 'Shipping',        decision: 'approved', date: '2026-01-30' },
      { description: 'Personal parking permit',     amount: 120,  category: 'Parking',         decision: 'denied',   date: '2025-11-10' },
    ],
  },
  'emp-006': {
    totalSpent90d: 38000,
    avgMonthlySpend: 12667,
    approvalsRequested12m: 18,
    approvalsApproved12m: 17,
    approvalsDenied12m: 1,
    flaggedTransactions: 1,
    commonCategories: ['Fuel', 'Vehicle Maintenance', 'Permits & Licenses', 'Tires'],
    recentApprovals: [
      { description: 'Michelin tire set (Unit 7)',    amount: 8400,  category: 'Tires',        decision: 'approved', date: '2026-03-12' },
      { description: 'Engine overhaul (Unit 3)',      amount: 14200, category: 'Maintenance',  decision: 'approved', date: '2026-02-08' },
      { description: 'WSDOT oversize permits (batch)',amount: 6234,  category: 'Permits',      decision: 'approved', date: '2026-01-20' },
    ],
  },
};

const POLICY_RULES = [
  { id: 'p1', title: 'Pre-authorization threshold', description: 'All expenses over $50 must be pre-authorized by a manager and accompanied by receipts before reimbursement.', category: 'Approval',         severity: 'high'   },
  { id: 'p2', title: 'No personal charges',         description: 'Corporate cards must not be used for personal expenses. Consistent abuse may result in card revocation.',       category: 'Corporate Cards', severity: 'high'   },
  { id: 'p3', title: 'Alcohol restriction',         description: 'Alcohol may only be expensed when dining with a customer. Guest names and purpose must be on the receipt.',     category: 'Entertainment',   severity: 'medium' },
  { id: 'p4', title: 'Tip limit',                  description: 'Tips are reimbursable up to 15% for services and up to 20% for meals.',                                         category: 'Meals',           severity: 'low'    },
  { id: 'p5', title: 'Receipt submission deadline', description: 'Receipts should be submitted within the current billing month. Falsifying reports is strictly prohibited.',    category: 'Receipts',        severity: 'medium' },
  { id: 'p6', title: 'Traffic/parking fines',      description: 'Traffic tickets and parking fines are NOT reimbursable. Only legitimate parking fees are covered.',             category: 'Transportation',  severity: 'high'   },
  { id: 'p7', title: 'Conference approval',         description: 'Conference registrations over $500 require manager sign-off and must relate to the employee\'s job function.',  category: 'Conferences',     severity: 'medium' },
  { id: 'p8', title: 'Hotel nightly limit',         description: 'Hotel stays should not exceed $250/night without prior approval. Receipts are mandatory.',                     category: 'Travel',          severity: 'medium' },
];

// Pending approval requests
const APPROVAL_REQUESTS = [
  {
    id: 'apr-001',
    requestedAt: '2026-05-29T09:15:00Z',
    status: 'pending',
    employeeId: 'emp-001',
    expense: {
      amount: 1200,
      currency: 'CAD',
      merchant: 'TechSummit 2026 — Conference Registration',
      category: 'Conferences & Events',
      description: 'Annual tech marketing conference in Toronto. Three-day event covering digital marketing trends, AI tools, and brand strategy.',
      date: '2026-06-15',
      hasReceipt: true,
    },
    relevantPolicies: ['p1', 'p7'],
  },
  {
    id: 'apr-002',
    requestedAt: '2026-05-29T11:42:00Z',
    status: 'pending',
    employeeId: 'emp-002',
    expense: {
      amount: 3800,
      currency: 'CAD',
      merchant: 'Amazon Web Services — Cloud Infrastructure',
      category: 'Cloud Services',
      description: 'Q2 AWS compute and storage credits for the new microservices migration project. Covers EC2, RDS, and S3 costs for June.',
      date: '2026-06-01',
      hasReceipt: true,
    },
    relevantPolicies: ['p1'],
  },
  {
    id: 'apr-003',
    requestedAt: '2026-05-29T22:48:00Z',
    status: 'pending',
    employeeId: 'emp-003',
    expense: {
      amount: 648,
      currency: 'CAD',
      merchant: 'The Capital Grille — Dinner',
      category: 'Meals',
      description: 'Working dinner.',
      date: '2026-05-29',
      hasReceipt: false,
    },
    relevantPolicies: ['p1', 'p3', 'p5'],
  },
  {
    id: 'apr-004',
    requestedAt: '2026-05-28T14:30:00Z',
    status: 'pending',
    employeeId: 'emp-004',
    expense: {
      amount: 2840,
      currency: 'CAD',
      merchant: 'Marriott Toronto Downtown — Hotel (4 nights)',
      category: 'Travel & Hotels',
      description: 'Hotel accommodation for Q3 client meetings at Toronto HQ. Rate is $710/night.',
      date: '2026-06-10',
      hasReceipt: true,
    },
    relevantPolicies: ['p1', 'p8'],
  },
  {
    id: 'apr-005',
    requestedAt: '2026-05-30T08:05:00Z',
    status: 'pending',
    employeeId: 'emp-005',
    expense: {
      amount: 85,
      currency: 'CAD',
      merchant: 'City of Toronto — Parking Fine #4829-X',
      category: 'Transportation',
      description: 'Parking fine received while delivering office supplies.',
      date: '2026-05-28',
      hasReceipt: true,
    },
    relevantPolicies: ['p6'],
  },
  {
    id: 'apr-006',
    requestedAt: '2026-05-28T07:20:00Z',
    status: 'pending',
    employeeId: 'emp-006',
    expense: {
      amount: 12480,
      currency: 'CAD',
      merchant: 'Bridgestone Canada — Tire Replacement (Fleet Units 4 & 9)',
      category: 'Vehicle Maintenance',
      description: 'Scheduled full tire replacement for two fleet units ahead of summer long-haul routes. 8 tires total at $1,560 each.',
      date: '2026-06-02',
      hasReceipt: true,
    },
    relevantPolicies: ['p1'],
  },
];

// Decision log (in-memory for demo)
const decisions = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApprovalSummary(req) {
  const employee = EMPLOYEES.find(e => e.id === req.employeeId);
  const budget = DEPARTMENT_BUDGETS[employee.department];
  const history = EMPLOYEE_HISTORY[req.employeeId];
  const policies = POLICY_RULES.filter(p => req.relevantPolicies.includes(p.id));

  const remaining = budget.total - budget.used;
  const remainingAfter = remaining - req.expense.amount;
  const budgetPct = Math.round((budget.used / budget.total) * 100);

  return { employee, budget, history, policies, remaining, remainingAfter, budgetPct };
}

function formatHistory(history) {
  return `
- Total spent (last 90 days): $${history.totalSpent90d.toLocaleString()} CAD
- Average monthly spend: $${history.avgMonthlySpend.toLocaleString()} CAD
- Approval requests (last 12 months): ${history.approvalsRequested12m} requested, ${history.approvalsApproved12m} approved, ${history.approvalsDenied12m} denied
- Flagged transactions: ${history.flaggedTransactions}
- Common expense categories: ${history.commonCategories.join(', ')}
- Recent approvals:
${history.recentApprovals.map(a => `  • "${a.description}" — $${a.amount} (${a.decision})`).join('\n')}`.trim();
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

async function generateApprovalAnalysis(approvalId) {
  const req = APPROVAL_REQUESTS.find(a => a.id === approvalId);
  if (!req) throw new Error('Approval not found');

  const { employee, budget, history, policies, remaining, remainingAfter, budgetPct } = buildApprovalSummary(req);

  const submittedTime = new Date(req.requestedAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dayOfWeek = new Date(req.requestedAt).toLocaleDateString('en-CA', { weekday: 'long' });

  const prompt = `You are an AI expense approval assistant for a company. Analyze the following expense approval request and provide a detailed, context-aware recommendation.

## Approval Request
- Employee: ${employee.name} (${employee.role}, ${employee.department} dept)
- Years at company: ${employee.yearsAtCompany}
- Submitted: ${dayOfWeek} at ${submittedTime}
- Expense: $${req.expense.amount.toLocaleString()} ${req.expense.currency}
- Merchant: ${req.expense.merchant}
- Category: ${req.expense.category}
- Description: "${req.expense.description}"
- Expense date: ${req.expense.date}
- Receipt attached: ${req.expense.hasReceipt ? 'Yes' : 'No'}

## Department Budget (${employee.department} — ${budget.period})
- Total budget: $${budget.total.toLocaleString()} CAD
- Used so far: $${budget.used.toLocaleString()} CAD (${budgetPct}%)
- Remaining now: $${remaining.toLocaleString()} CAD
- Remaining if approved: $${remainingAfter.toLocaleString()} CAD ${remainingAfter < 0 ? '⚠️ OVER BUDGET' : ''}

## Employee Spending History
${formatHistory(history)}

## Relevant Policy Rules
${policies.map(p => `- [${p.severity.toUpperCase()}] ${p.title}: ${p.description}`).join('\n')}

## Instructions
Analyze this request carefully. Consider:
1. Is the amount reasonable for the category and employee's role?
2. Does it align with the employee's past spending patterns?
3. Are there any policy violations (explicit or contextual)?
4. What is the budget impact?
5. Are there any suspicious patterns (e.g., unusual time of submission, missing receipt, vague description)?
6. Are there similar past approvals that set a precedent?

Respond ONLY with a valid JSON object in this exact structure:
{
  "recommendation": "approve" | "deny" | "review",
  "riskScore": <integer 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "headline": "<one-sentence summary of the recommendation, max 15 words>",
  "reasoning": "<2-4 sentence explanation of the recommendation for the approver>",
  "flags": ["<concern 1>", "<concern 2>"],
  "positives": ["<positive factor 1>", "<positive factor 2>"],
  "policyViolations": ["<violation description>"] or [],
  "budgetImpact": "<one sentence on budget impact>",
  "patternInsights": "<one sentence on spending pattern>",
  "approverAction": "<what the approver should do or check before deciding, max 20 words>"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  return JSON.parse(jsonMatch[0]);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/approvals', (req, res) => {
  const result = APPROVAL_REQUESTS.map(r => {
    const employee = EMPLOYEES.find(e => e.id === r.employeeId);
    const budget = DEPARTMENT_BUDGETS[employee.department];
    const history = EMPLOYEE_HISTORY[r.employeeId];
    const remaining = budget.total - budget.used;
    return {
      id: r.id,
      requestedAt: r.requestedAt,
      status: decisions[r.id]?.status ?? r.status,
      employee: {
        id: employee.id,
        name: employee.name,
        initials: employee.initials,
        department: employee.department,
        role: employee.role,
      },
      expense: r.expense,
      budget: {
        total: budget.total,
        used: budget.used,
        remaining,
        period: budget.period,
        percentUsed: Math.round((budget.used / budget.total) * 100),
      },
      approvalsRequested12m: history.approvalsRequested12m,
      approvalsDenied12m: history.approvalsDenied12m,
      flaggedTransactions: history.flaggedTransactions,
    };
  });
  res.json(result);
});

app.get('/approvals/:id', (req, res) => {
  const r = APPROVAL_REQUESTS.find(a => a.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });

  const { employee, budget, history, policies, remaining, remainingAfter, budgetPct } = buildApprovalSummary(r);

  res.json({
    id: r.id,
    requestedAt: r.requestedAt,
    status: decisions[r.id]?.status ?? r.status,
    employee: {
      id: employee.id,
      name: employee.name,
      initials: employee.initials,
      department: employee.department,
      role: employee.role,
      yearsAtCompany: employee.yearsAtCompany,
    },
    expense: r.expense,
    budget: {
      total: budget.total,
      used: budget.used,
      remaining,
      remainingAfter,
      period: budget.period,
      percentUsed: budgetPct,
    },
    history: {
      totalSpent90d: history.totalSpent90d,
      avgMonthlySpend: history.avgMonthlySpend,
      approvalsRequested12m: history.approvalsRequested12m,
      approvalsApproved12m: history.approvalsApproved12m,
      approvalsDenied12m: history.approvalsDenied12m,
      flaggedTransactions: history.flaggedTransactions,
      commonCategories: history.commonCategories,
      recentApprovals: history.recentApprovals,
    },
    policies,
    decision: decisions[r.id] ?? null,
  });
});

app.post('/approvals/:id/analyze', async (req, res) => {
  try {
    const analysis = await generateApprovalAnalysis(req.params.id);
    res.json(analysis);
  } catch (err) {
    console.error('Analysis error:', err.message);
    // Fallback when no API key
    const r = APPROVAL_REQUESTS.find(a => a.id === req.params.id);
    const { remaining } = buildApprovalSummary(r);
    const isOverBudget = remaining - r.expense.amount < 0;
    res.json({
      recommendation: isOverBudget ? 'deny' : r.expense.amount > 5000 ? 'review' : 'approve',
      riskScore: isOverBudget ? 85 : r.expense.amount > 5000 ? 45 : 20,
      riskLevel: isOverBudget ? 'high' : r.expense.amount > 5000 ? 'medium' : 'low',
      headline: isOverBudget ? 'Exceeds remaining department budget.' : 'Expense appears within policy.',
      reasoning: isOverBudget
        ? 'This expense would push the department over budget for the period.'
        : 'Amount is consistent with the employee\'s role and spending history.',
      flags: isOverBudget ? ['Would exceed department budget'] : [],
      positives: ['Employee has good approval history'],
      policyViolations: [],
      budgetImpact: `$${(remaining - r.expense.amount).toLocaleString()} remaining after approval.`,
      patternInsights: 'Spending pattern is consistent with previous months.',
      approverAction: 'Review receipt and confirm expense aligns with business purpose.',
      _fallback: true,
    });
  }
});

app.post('/approvals/:id/decision', (req, res) => {
  const { action, note } = req.body; // action: 'approve' | 'deny' | 'review'
  const r = APPROVAL_REQUESTS.find(a => a.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });

  decisions[req.params.id] = {
    status: action,
    note: note || '',
    decidedAt: new Date().toISOString(),
  };
  res.json({ success: true, status: action });
});

app.get('/policy/rules', (req, res) => res.json(POLICY_RULES));

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(8000, () => console.log('TrailBlazer API → http://localhost:8000'));
