import { MonthFilter } from "@/components/fields";
import { PaymentForm } from "@/components/ledger-forms";
import { PaymentTable } from "@/components/ledger-tables";
import { PageHeader, StatTile } from "@/components/page-header";
import { requireMember } from "@/lib/auth";
import { isMonth, monthRange, sum } from "@/lib/finance";
import { formatZAR, todayISO } from "@/lib/format";
import { getProjectOptions } from "@/lib/queries";
import type { Payment } from "@/lib/types";

export default async function PaymentsPage({ searchParams }: PageProps<"/payments">) {
  const { supabase } = await requireMember();
  const { month: rawMonth } = await searchParams;
  const month = isMonth(rawMonth) ? rawMonth : "";

  let query = supabase
    .from("payments")
    .select("*, projects(code, name, client)")
    .order("received_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (month) {
    const { from, to } = monthRange(month);
    query = query.gte("received_on", from).lt("received_on", to);
  }

  const [{ data }, projects] = await Promise.all([query, getProjectOptions(supabase)]);
  const payments = (data ?? []) as Payment[];

  return (
    <>
      <PageHeader
        title="Client payments"
        subtitle="Every deposit, instalment and final payment Ruben receives. Savings due uses the project's savings %."
      />

      <PaymentForm projects={projects} today={todayISO()} />

      <div className="mt-6">
        <MonthFilter month={month} />
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Payments received" value={formatZAR(sum(payments, (p) => p.amount))} note={`${payments.length} payments`} />
        <StatTile label="Savings due" value={formatZAR(sum(payments, (p) => p.savings_due))} />
        <StatTile
          label="Kept for operations"
          value={formatZAR(sum(payments, (p) => p.amount) - sum(payments, (p) => p.savings_due))}
        />
      </section>

      <section className="card mt-4 p-0 sm:p-2">
        <PaymentTable payments={payments} />
      </section>
    </>
  );
}
