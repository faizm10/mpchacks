export type Severity = "critical" | "high" | "medium" | "low";

export type PolicyRule = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  recommendation: string;
  mccCodes?: number[];
  threshold?: number;
};

export const POLICY_RULES: PolicyRule[] = [
  {
    id: "approval_threshold",
    title: "Pre-Authorization Required",
    description: "All expenses over $50.00 must be pre-authorized by manager",
    category: "Approval",
    severity: "high",
    recommendation: "Obtain manager pre-authorization for expenses exceeding $50",
    threshold: 50,
  },
  {
    id: "receipt_required",
    title: "Receipt Required",
    description: "Receipts are required before any expense over $50 is reimbursed",
    category: "Documentation",
    severity: "medium",
    recommendation: "Submit receipt documentation for this transaction",
    threshold: 50,
  },
  {
    id: "split_charge",
    title: "Approval Splitting Detected",
    description: "Multiple charges to the same merchant within 24h that together exceed the approval threshold — a common tactic to avoid pre-authorization",
    category: "Fraud",
    severity: "critical",
    recommendation: "Escalate to finance team. Investigate intent to split charges below approval threshold.",
  },
  {
    id: "alcohol_no_customer",
    title: "Alcohol Without Customer Context",
    description: "Alcoholic beverages are not permitted unless dining with a customer. Names of guests and purpose must be listed.",
    category: "Entertainment",
    severity: "medium",
    recommendation: "Provide customer name(s) and business purpose, or deny reimbursement.",
    mccCodes: [5813, 5812, 5814],
  },
  {
    id: "meal_over_limit",
    title: "Excessive Meal Expense",
    description: "Meal expense appears unusually high relative to solo dining norms. Policy requires reasonable entertainment limits.",
    category: "Meals",
    severity: "medium",
    recommendation: "Verify attendee count and business purpose. Amounts over $75/person require justification.",
    mccCodes: [5812, 5814, 5811],
    threshold: 75,
  },
  {
    id: "personal_expense",
    title: "Potential Personal Expense",
    description: "Transaction category suggests personal use. Use of corporate credit cards for personal expenses is prohibited.",
    category: "Personal",
    severity: "high",
    recommendation: "Request business justification. Deny if personal use confirmed.",
    mccCodes: [5947, 7922, 7832, 5999],
  },
  {
    id: "restricted_merchant",
    title: "Restricted Merchant Category",
    description: "Merchant category is not typically reimbursable under Brim expense policy.",
    category: "Category",
    severity: "high",
    recommendation: "Review merchant category and deny unless clear business justification provided.",
    mccCodes: [6011, 7995, 5912],
  },
  {
    id: "tip_over_limit",
    title: "Tip Exceeds Policy Limit",
    description: "Tips are capped at 15% for services/porterage and 20% for meals.",
    category: "Gratuity",
    severity: "low",
    recommendation: "Reimburse only up to the policy-allowed tip percentage.",
  },
  {
    id: "large_transaction",
    title: "High-Value Transaction",
    description: "Transaction amount is significantly above average and warrants additional scrutiny.",
    category: "Amount",
    severity: "medium",
    recommendation: "Verify business purpose and ensure manager approval was obtained.",
    threshold: 1000,
  },
  {
    id: "entertainment_missing_info",
    title: "Entertainment — Missing Guest Info",
    description: "Customer entertainment requires names of guests and purpose listed with receipts.",
    category: "Entertainment",
    severity: "medium",
    recommendation: "Require employee to submit guest list and business purpose before approval.",
    mccCodes: [5812, 5813, 5814, 7011],
  },
];

export const MCC_LABELS: Record<number, string> = {
  9399: "Government / Permits",
  5541: "Gas / Fuel Station",
  5542: "Automated Fuel",
  7542: "Car Wash",
  4816: "Online Services",
  4784: "Tolls / Bridge Fees",
  5046: "Commercial Equipment",
  5533: "Auto Parts",
  7538: "Auto Repair",
  4121: "Taxi / Rideshare",
  7399: "Business Services",
  5734: "Computer / Software",
  5814: "Fast Food",
  5812: "Restaurant",
  5813: "Bar / Tavern",
  7011: "Hotel / Lodging",
  5411: "Grocery Store",
  8220: "College / University",
  4789: "Transportation",
  5085: "Industrial Supplies",
  5300: "Wholesale Club",
  5561: "Recreational Vehicles",
  5947: "Gift Cards / Novelty",
  4215: "Courier / Shipping",
  5532: "Tire / Auto Shop",
  5045: "Computers / Peripherals",
  6011: "ATM / Cash Advance",
  4812: "Telecom",
  4899: "Cable / Satellite",
  5251: "Hardware Store",
  7995: "Gambling",
  5811: "Caterers",
};
