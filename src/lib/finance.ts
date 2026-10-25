import { num } from "@/lib/format";

type PaymentRow = { project_id: string; amount: number | string; savings_due: number | string };
type SavingsRow = { kind: string; amount: number | string; project_id: string | null };
type ExpenseRow = { amount: number | string; project_id: string | null };

export type ProjectTotals = {
  paid: number;
  savingsDue: number;
  transferred: number;
  expenses: number;
};

const empty = (): ProjectTotals => ({ paid: 0, savingsDue: 0, transferred: 0, expenses: 0 });

// Roll payments, savings transfers and expenses up to each project.
export function totalsByProject(
  payments: PaymentRow[],
  savings: SavingsRow[],
  expenses: ExpenseRow[],
): Map<string, ProjectTotals> {
  const map = new Map<string, ProjectTotals>();
  const get = (id: string) => {
    let row = map.get(id);
    if (!row) map.set(id, (row = empty()));
    return row;
  };

  for (const p of payments) {
    const row = get(p.project_id);
    row.paid += num(p.amount);
    row.savingsDue += num(p.savings_due);
  }
  for (const s of savings) {
    if (s.kind === "transfer" && s.project_id) get(s.project_id).transferred += num(s.amount);
  }
  for (const e of expenses) {
    if (e.project_id) get(e.project_id).expenses += num(e.amount);
  }
  return map;
}

export const totalsFor = (map: Map<string, ProjectTotals>, id: string) => map.get(id) ?? empty();

// Savings account balance: everything in, less withdrawals.
export function savingsBalance(savings: SavingsRow[]) {
  let transfers = 0;
  let interest = 0;
  let withdrawals = 0;
  for (const s of savings) {
    if (s.kind === "transfer") transfers += num(s.amount);
    else if (s.kind === "interest") interest += num(s.amount);
    else withdrawals += num(s.amount);
  }
  return { transfers, interest, withdrawals, balance: transfers + interest - withdrawals };
}

export const sum = <T,>(rows: T[], pick: (row: T) => number | string | null | undefined) =>
  rows.reduce((total, row) => total + num(pick(row)), 0);

// First day of a "YYYY-MM" month and of the month after it, for date range filters.
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return { from: `${month}-01`, to: next };
}

export const isMonth = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
