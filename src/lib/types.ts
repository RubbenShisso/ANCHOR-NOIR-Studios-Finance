export type FormState = { ok?: boolean; error?: string } | null;

export type ProjectStatus = "lead" | "quoted" | "in_progress" | "completed" | "on_hold" | "cancelled";

export type Campaign = {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  notes: string | null;
};

export type Project = {
  id: string;
  code: string;
  client: string;
  name: string;
  category: string | null;
  service: string | null;
  agreed_price: number;
  standard_price: number | null;
  campaign_id: string | null;
  status: ProjectStatus;
  savings_rate: number;
  website_url: string | null;
  client_industry: string | null;
  lead_source: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_on: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
};

export type PaymentKind = "deposit" | "instalment" | "final" | "other";

export type Payment = {
  id: string;
  project_id: string;
  received_on: string;
  kind: PaymentKind;
  amount: number;
  savings_rate: number;
  savings_due: number;
  reference: string | null;
  projects?: { code: string; name: string; client: string } | null;
};

export type SavingsKind = "transfer" | "interest" | "withdrawal";

export type SavingsEntry = {
  id: string;
  kind: SavingsKind;
  occurred_on: string;
  amount: number;
  project_id: string | null;
  reference: string | null;
  reason: string | null;
  approved_by: string | null;
  projects?: { code: string; name: string } | null;
};

export type Expense = {
  id: string;
  spent_on: string;
  project_id: string | null;
  category: string;
  description: string | null;
  amount: number;
  paid_by: string | null;
  projects?: { code: string; name: string } | null;
};

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "quoted", label: "Quoted" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
];

export const statusLabel = (s: string) => PROJECT_STATUSES.find((x) => x.value === s)?.label ?? s;

export const PROJECT_CATEGORIES = [
  "Website",
  "App / Software",
  "AI / Automation",
  "Design",
  "Video / Animation",
  "Maintenance",
  "Other",
];

export const LEAD_SOURCES = ["Referral", "Instagram", "WhatsApp", "Website enquiry", "Direct outreach", "Returning client", "Other"];

export const PAYMENT_KINDS: { value: PaymentKind; label: string }[] = [
  { value: "deposit", label: "Deposit" },
  { value: "instalment", label: "Instalment" },
  { value: "final", label: "Final payment" },
  { value: "other", label: "Other" },
];

export const paymentKindLabel = (k: string) => PAYMENT_KINDS.find((x) => x.value === k)?.label ?? k;

export const SAVINGS_KINDS: { value: SavingsKind; label: string }[] = [
  { value: "transfer", label: "Transfer from Ruben" },
  { value: "interest", label: "Interest" },
  { value: "withdrawal", label: "Withdrawal" },
];

export const savingsKindLabel = (k: string) => SAVINGS_KINDS.find((x) => x.value === k)?.label ?? k;

export const EXPENSE_CATEGORIES = [
  "Software & subscriptions",
  "Hosting & domains",
  "Freelancers",
  "Equipment",
  "Advertising",
  "Stock assets",
  "Travel",
  "Bank fees",
  "Other",
];

// Projects without a campaign are reported under this label.
export const REGULAR_CAMPAIGN = "Regular pricing";
