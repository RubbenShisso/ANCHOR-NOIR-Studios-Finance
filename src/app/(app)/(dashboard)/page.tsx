import Link from "next/link";
import { CampaignTable } from "@/components/campaign-table";
import { MonthlyChart, RankedBarChart } from "@/components/charts";
import { PageHeader, StatTile } from "@/components/page-header";
import { requireMember } from "@/lib/auth";
import { campaignPerformance } from "@/lib/campaigns";
import { isMonth, savingsBalance, sum, totalsByProject, totalsFor } from "@/lib/finance";
import { formatMonth, formatZAR, lastMonths, monthKey, num, todayISO } from "@/lib/format";
import type { Campaign, Project } from "@/lib/types";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { supabase } = await requireMember();
  const { month: rawMonth } = await searchParams;
  const currentMonth = monthKey(todayISO());
  const month = isMonth(rawMonth) ? rawMonth : currentMonth;
  const months = lastMonths(12);

  // Data volumes are small (one studio), so load everything and aggregate here.
  const [{ data: projectData }, { data: campaignData }, { data: paymentData }, { data: savingsData }, { data: expenseData }] =
    await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("campaigns").select("*").order("starts_on", { ascending: false }),
      supabase.from("payments").select("project_id, received_on, amount, savings_due"),
      supabase.from("savings_entries").select("kind, occurred_on, amount, project_id"),
      supabase.from("expenses").select("spent_on, amount, project_id"),
    ]);
  const projects = (projectData ?? []) as Project[];
  const campaigns = (campaignData ?? []) as Campaign[];
  const payments = paymentData ?? [];
  const savings = savingsData ?? [];
  const expenses = expenseData ?? [];

  const inMonth = (date: string | null) => !!date && monthKey(date) === month;
  const monthPayments = payments.filter((p) => inMonth(p.received_on));
  const monthTransfers = savings.filter((s) => s.kind === "transfer" && inMonth(s.occurred_on));
  const monthExpenses = expenses.filter((e) => inMonth(e.spent_on));
  const monthProjects = projects.filter((p) => inMonth(p.start_date ?? p.created_at.slice(0, 10)));

  const totals = totalsByProject(payments, savings, expenses);
  const { balance, transfers } = savingsBalance(savings);
  const savingsAwaiting = Math.max(0, sum(payments, (p) => p.savings_due) - transfers);
  const clientOutstanding = projects
    .filter((p) => p.status !== "cancelled" && p.status !== "lead")
    .reduce((s, p) => s + Math.max(0, num(p.agreed_price) - totalsFor(totals, p.id).paid), 0);

  // 12-month trend
  const trend = months.map((m) => ({
    month: formatMonth(m),
    payments: sum(payments.filter((p) => monthKey(p.received_on) === m), (p) => p.amount),
    transferred: sum(savings.filter((s) => s.kind === "transfer" && monthKey(s.occurred_on) === m), (s) => s.amount),
  }));

  // Income by service category over the same 12 months
  const categoryOf = new Map(projects.map((p) => [p.id, p.category ?? "Uncategorised"]));
  const byCategory = new Map<string, number>();
  for (const p of payments) {
    if (monthKey(p.received_on) < months[0]) continue;
    const cat = categoryOf.get(p.project_id) ?? "Uncategorised";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + num(p.amount));
  }
  const incomeByService = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const promotions = campaignPerformance(campaigns, projects, totals).filter((r) => r.projects > 0 || r.id === null);

  const owing = projects
    .map((p) => ({ ...p, owed: totalsFor(totals, p.id).savingsDue - totalsFor(totals, p.id).transferred }))
    .filter((p) => p.owed > 0.005)
    .sort((a, b) => b.owed - a.owed)
    .slice(0, 5);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Dashboard" subtitle={`Finance overview · ${formatMonth(month)} · all amounts in ZAR`} />
        <form className="mb-6 flex items-end gap-2">
          <div>
            <label className="label" htmlFor="d-month">Month</label>
            <select className="input" id="d-month" name="month" defaultValue={month}>
              {[...months].reverse().map((m) => (
                <option key={m} value={m}>{formatMonth(m)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-ghost">Show</button>
        </form>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Client payments this month"
          value={formatZAR(sum(monthPayments, (p) => p.amount))}
          note={`${monthPayments.length} payment${monthPayments.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Savings received this month"
          value={formatZAR(sum(monthTransfers, (s) => s.amount))}
          note={`${formatZAR(sum(monthPayments, (p) => p.savings_due))} due from this month's payments`}
        />
        <StatTile label="Outstanding client payments" value={formatZAR(clientOutstanding)} note="All open projects" />
        <StatTile
          label="Savings awaiting transfer"
          value={formatZAR(savingsAwaiting)}
          note={savingsAwaiting > 0.005 ? "⚠ Ruben still to transfer" : "✓ Fully reconciled"}
        />
      </section>
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Savings balance" value={formatZAR(balance)} note="Transfers + interest − withdrawals" />
        <StatTile label="Expenses this month" value={formatZAR(sum(monthExpenses, (e) => e.amount))} />
        <StatTile
          label="New projects this month"
          value={String(monthProjects.length)}
          note={`${formatZAR(sum(monthProjects, (p) => p.agreed_price))} agreed value`}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <h2 className="text-sm font-semibold">Client payments vs savings transferred, last 12 months</h2>
          <div className="mt-3">
            <MonthlyChart
              data={trend}
              series={[
                { key: "payments", label: "Client payments" },
                { key: "transferred", label: "Savings transferred" },
              ]}
            />
          </div>
        </div>
        <div className="card xl:col-span-2">
          <h2 className="text-sm font-semibold">Income by service, last 12 months</h2>
          <div className="mt-3">
            {incomeByService.length ? (
              <RankedBarChart data={incomeByService} label="Payments received" />
            ) : (
              <p className="py-12 text-center text-sm text-muted">No client payments recorded yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-5">
        <div className="card p-0 sm:p-2 xl:col-span-3">
          <div className="flex items-baseline justify-between px-3 pt-3 sm:px-1">
            <h2 className="text-sm font-semibold">Promotion performance, all time</h2>
            <Link href="/promotions" className="text-xs text-accent">Details →</Link>
          </div>
          <CampaignTable rows={promotions} />
        </div>
        <div className="card xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Savings still to transfer</h2>
            <Link href="/savings" className="text-xs text-accent">Reconcile →</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {owing.length === 0 && <li className="text-muted">✓ Every project&apos;s savings have been transferred.</li>}
            {owing.map((p) => (
              <li key={p.id} className="flex justify-between gap-4">
                <Link href={`/projects/${p.id}`} className="truncate hover:text-accent">
                  <span className="font-mono text-xs text-accent">{p.code}</span> {p.client}
                </Link>
                <span className="num text-warning">{formatZAR(p.owed)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
