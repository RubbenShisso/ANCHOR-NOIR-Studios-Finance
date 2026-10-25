import { MonthFilter } from "@/components/fields";
import { ExpenseForm } from "@/components/ledger-forms";
import { ExpenseTable } from "@/components/ledger-tables";
import { PageHeader, StatTile } from "@/components/page-header";
import { requireMember } from "@/lib/auth";
import { isMonth, monthRange, sum } from "@/lib/finance";
import { formatZAR, todayISO } from "@/lib/format";
import { getProjectOptions } from "@/lib/queries";
import type { Expense } from "@/lib/types";

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const { supabase } = await requireMember();
  const { month: rawMonth } = await searchParams;
  const month = isMonth(rawMonth) ? rawMonth : "";

  let query = supabase
    .from("expenses")
    .select("*, projects(code, name)")
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (month) {
    const { from, to } = monthRange(month);
    query = query.gte("spent_on", from).lt("spent_on", to);
  }

  const [{ data }, projects] = await Promise.all([query, getProjectOptions(supabase)]);
  const expenses = (data ?? []) as Expense[];
  const projectCosts = sum(expenses.filter((e) => e.project_id), (e) => e.amount);
  const total = sum(expenses, (e) => e.amount);

  return (
    <>
      <PageHeader title="Expenses" subtitle="Direct project costs and general business costs" />

      <ExpenseForm projects={projects} today={todayISO()} />

      <div className="mt-6">
        <MonthFilter month={month} />
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total expenses" value={formatZAR(total)} note={`${expenses.length} entries`} />
        <StatTile label="Project costs" value={formatZAR(projectCosts)} />
        <StatTile label="General business costs" value={formatZAR(total - projectCosts)} />
      </section>

      <section className="card mt-4 p-0 sm:p-2">
        <ExpenseTable expenses={expenses} />
      </section>
    </>
  );
}
