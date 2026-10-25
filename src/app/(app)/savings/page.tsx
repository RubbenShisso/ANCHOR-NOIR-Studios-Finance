import Link from "next/link";
import { SavingsForm } from "@/components/ledger-forms";
import { SavingsTable } from "@/components/ledger-tables";
import { PageHeader, StatTile } from "@/components/page-header";
import { requireMember } from "@/lib/auth";
import { savingsBalance, sum, totalsByProject, totalsFor } from "@/lib/finance";
import { formatZAR, todayISO } from "@/lib/format";
import { getProjectOptions } from "@/lib/queries";
import type { SavingsEntry } from "@/lib/types";

export default async function SavingsPage() {
  const { supabase } = await requireMember();

  const [{ data: entryData }, { data: paymentData }, projects] = await Promise.all([
    supabase
      .from("savings_entries")
      .select("*, projects(code, name)")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("project_id, amount, savings_due"),
    getProjectOptions(supabase),
  ]);
  const entries = (entryData ?? []) as SavingsEntry[];
  const payments = paymentData ?? [];

  const { balance, transfers, interest, withdrawals } = savingsBalance(entries);
  const totalDue = sum(payments, (p) => p.savings_due);
  const unlinkedTransfers = sum(
    entries.filter((e) => e.kind === "transfer" && !e.project_id),
    (e) => e.amount,
  );

  // Reconciliation: what each project's payments say should be saved vs what actually arrived.
  const totals = totalsByProject(payments, entries, []);
  const reconciliation = projects
    .map((p) => ({ ...p, ...totalsFor(totals, p.id) }))
    .filter((p) => p.savingsDue > 0 || p.transferred > 0);

  return (
    <>
      <PageHeader
        title="Business savings"
        subtitle="Money Ruben transfers into the Anchor Noir savings account, plus interest and withdrawals"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Savings balance" value={formatZAR(balance)} note="Transfers + interest − withdrawals" />
        <StatTile label="Transferred by Ruben" value={formatZAR(transfers)} note={`Interest ${formatZAR(interest)}`} />
        <StatTile
          label="Awaiting transfer"
          value={formatZAR(Math.max(0, totalDue - transfers))}
          note={`${formatZAR(totalDue)} due from all payments`}
        />
        <StatTile label="Withdrawn" value={formatZAR(withdrawals)} />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Record a transfer, interest or withdrawal</h2>
      <SavingsForm projects={projects} today={todayISO()} />

      <section className="card mt-6">
        <h2 className="text-sm font-semibold">Savings reconciliation by project</h2>
        <p className="mt-1 text-xs text-muted">
          Savings due is calculated from each client payment. Link transfers to a project so they reconcile here.
        </p>
        {reconciliation.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nothing to reconcile yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th className="num">Client paid</th>
                  <th className="num">Savings due</th>
                  <th className="num">Transferred</th>
                  <th className="num">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.map((p) => {
                  const outstanding = p.savingsDue - p.transferred;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/projects/${p.id}`} className="hover:text-accent">
                          <span className="font-mono text-xs text-accent">{p.code}</span> {p.client} — {p.name}
                        </Link>
                      </td>
                      <td className="num">{formatZAR(p.paid)}</td>
                      <td className="num">{formatZAR(p.savingsDue)}</td>
                      <td className="num">{formatZAR(p.transferred)}</td>
                      <td className={`num ${outstanding > 0.005 ? "text-warning" : "text-ink-2"}`}>
                        {outstanding > 0.005 ? `⚠ ${formatZAR(outstanding)}` : outstanding < -0.005 ? `${formatZAR(-outstanding)} over` : "✓ Settled"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {unlinkedTransfers > 0 && (
          <p className="mt-3 text-xs text-muted">
            {formatZAR(unlinkedTransfers)} of transfers aren&apos;t linked to a project and aren&apos;t shown above.
          </p>
        )}
      </section>

      <section className="card mt-6 p-0 sm:p-2">
        <h2 className="px-3 pt-3 text-sm font-semibold sm:px-1">Savings account history</h2>
        <SavingsTable entries={entries} />
      </section>
    </>
  );
}
