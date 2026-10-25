import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { DeleteButton } from "@/components/delete-button";
import { ExpenseForm, PaymentForm, SavingsForm } from "@/components/ledger-forms";
import { ExpenseTable, PaymentTable, SavingsTable } from "@/components/ledger-tables";
import { StatTile } from "@/components/page-header";
import { Progress } from "@/components/progress";
import { requireMember } from "@/lib/auth";
import { sum } from "@/lib/finance";
import { formatDate, formatZAR, num, todayISO } from "@/lib/format";
import { REGULAR_CAMPAIGN, statusLabel, type Campaign, type Expense, type Payment, type Project, type SavingsEntry } from "@/lib/types";
import { deleteProject, updateProject } from "../actions";
import { ProjectFields } from "../project-fields";

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { supabase } = await requireMember();

  const [{ data: project }, { data: campaignData }, { data: paymentData }, { data: savingsData }, { data: expenseData }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle<Project>(),
      supabase.from("campaigns").select("*").order("starts_on", { ascending: false }),
      supabase.from("payments").select("*").eq("project_id", id).order("received_on", { ascending: false }),
      supabase.from("savings_entries").select("*").eq("project_id", id).order("occurred_on", { ascending: false }),
      supabase.from("expenses").select("*").eq("project_id", id).order("spent_on", { ascending: false }),
    ]);
  if (!project) notFound();

  const campaigns = (campaignData ?? []) as Campaign[];
  const payments = (paymentData ?? []) as Payment[];
  const savings = (savingsData ?? []) as SavingsEntry[];
  const expenses = (expenseData ?? []) as Expense[];

  const agreed = num(project.agreed_price);
  const paid = sum(payments, (p) => p.amount);
  const savingsDue = sum(payments, (p) => p.savings_due);
  const transferred = sum(savings.filter((s) => s.kind === "transfer"), (s) => s.amount);
  const costs = sum(expenses, (e) => e.amount);
  const owes = Math.max(0, agreed - paid);
  const campaign = campaigns.find((c) => c.id === project.campaign_id);
  const self = [{ id: project.id, code: project.code, name: project.name, client: project.client }];
  const today = todayISO();

  const details: [string, React.ReactNode][] = [
    ["Category", project.category],
    ["Package / service", project.service],
    ["Promotion", campaign?.name ?? REGULAR_CAMPAIGN],
    ["Standard price", project.standard_price != null ? formatZAR(num(project.standard_price)) : null],
    ["Savings %", `${num(project.savings_rate)}%`],
    ["Client industry", project.client_industry],
    ["Lead source", project.lead_source],
    [
      "Website",
      project.website_url ? (
        <a href={project.website_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          {project.website_url.replace(/^https?:\/\//, "")}
        </a>
      ) : null,
    ],
    ["Started", project.start_date && formatDate(project.start_date)],
    ["Due", project.due_date && formatDate(project.due_date)],
    ["Completed", project.completed_on && formatDate(project.completed_on)],
    ["Scope", project.description],
    ["Notes", project.notes],
  ];

  return (
    <>
      <Link href="/projects" className="text-xs text-muted hover:text-ink">← Projects</Link>
      <header className="mb-6 mt-1">
        <p className="font-mono text-xs text-accent">{project.code}</p>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {project.client} · {statusLabel(project.status)}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Agreed price" value={formatZAR(agreed)} note={owes > 0 ? `Client still owes ${formatZAR(owes)}` : "✓ Paid in full"} />
        <StatTile label="Client paid" value={formatZAR(paid)} note={`${payments.length} payment${payments.length === 1 ? "" : "s"}`} />
        <StatTile
          label="Savings transferred"
          value={formatZAR(transferred)}
          note={
            savingsDue - transferred > 0.005
              ? `⚠ ${formatZAR(savingsDue - transferred)} of ${formatZAR(savingsDue)} still to transfer`
              : `✓ ${formatZAR(savingsDue)} due, all transferred`
          }
        />
        <StatTile label="Profit after costs" value={formatZAR(paid - costs)} note={`Expenses ${formatZAR(costs)}`} />
      </section>
      <div className="mt-4">
        <Progress value={paid} max={agreed} tone={paid >= agreed && agreed > 0 ? "good" : "accent"} />
        <p className="mt-1 text-xs text-muted">{agreed > 0 ? `${Math.round((paid / agreed) * 100)}% of agreed price received` : "No agreed price set"}</p>
      </div>

      <section className="card mt-6">
        <h2 className="text-sm font-semibold">Project details</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-0.5">{value || <span className="text-muted">—</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Client payments</h2>
      <PaymentForm projects={self} today={today} projectId={project.id} />
      <section className="card mt-3 p-0 sm:p-2">
        <PaymentTable payments={payments} showProject={false} />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Savings transfers for this project</h2>
      <SavingsForm projects={self} today={today} projectId={project.id} />
      <section className="card mt-3 p-0 sm:p-2">
        <SavingsTable entries={savings} showProject={false} />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Project expenses</h2>
      <ExpenseForm projects={self} today={today} projectId={project.id} />
      <section className="card mt-3 p-0 sm:p-2">
        <ExpenseTable expenses={expenses} showProject={false} />
      </section>

      <details className="card mt-8">
        <summary className="cursor-pointer text-sm font-semibold">Edit project</summary>
        <ActionForm
          action={updateProject.bind(null, project.id)}
          submitLabel="Save changes"
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <ProjectFields project={project} campaigns={campaigns} />
        </ActionForm>
        <div className="mt-6 border-t border-line pt-4">
          <DeleteButton
            action={deleteProject}
            id={project.id}
            label="Delete project"
            confirmText={`Delete ${project.code}? Its payments must be deleted first; expenses and transfers are kept but unlinked.`}
          />
        </div>
      </details>
    </>
  );
}
