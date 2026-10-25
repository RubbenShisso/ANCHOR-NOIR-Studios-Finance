import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/auth";
import { totalsByProject, totalsFor } from "@/lib/finance";
import { formatZAR, num } from "@/lib/format";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  REGULAR_CAMPAIGN,
  statusLabel,
  type Campaign,
  type Project,
} from "@/lib/types";
import { createProject } from "./actions";
import { ProjectFields } from "./project-fields";

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const { supabase } = await requireMember();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const campaign = typeof params.campaign === "string" ? params.campaign : "";
  const category = typeof params.category === "string" ? params.category : "";

  let query = supabase.from("projects").select("*").order("code", { ascending: false });
  if (status === "open") query = query.not("status", "in", "(completed,cancelled)");
  else if (status) query = query.eq("status", status);
  if (campaign === "regular") query = query.is("campaign_id", null);
  else if (campaign) query = query.eq("campaign_id", campaign);
  if (category) query = query.eq("category", category);

  const [{ data: projectData }, { data: campaignData }, { data: payments }, { data: savings }] = await Promise.all([
    query,
    supabase.from("campaigns").select("*").order("starts_on", { ascending: false }),
    supabase.from("payments").select("project_id, amount, savings_due"),
    supabase.from("savings_entries").select("kind, amount, project_id").eq("kind", "transfer"),
  ]);
  const projects = (projectData ?? []) as Project[];
  const campaigns = (campaignData ?? []) as Campaign[];
  const campaignName = new Map(campaigns.map((c) => [c.id, c.name]));
  const totals = totalsByProject(payments ?? [], savings ?? [], []);

  return (
    <>
      <PageHeader title="Projects" subtitle="Register every project once. Payments, savings and expenses link to its ID." />

      <details className="card">
        <summary className="cursor-pointer text-sm font-semibold">+ New project</summary>
        <ActionForm action={createProject} submitLabel="Create project" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <ProjectFields campaigns={campaigns} />
        </ActionForm>
      </details>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="f-status">Status</label>
          <select className="input" id="f-status" name="status" defaultValue={status}>
            <option value="">All</option>
            <option value="open">Open (not completed or cancelled)</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-campaign">Promotion</label>
          <select className="input" id="f-campaign" name="campaign" defaultValue={campaign}>
            <option value="">All</option>
            <option value="regular">{REGULAR_CAMPAIGN}</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-category">Category</label>
          <select className="input" id="f-category" name="category" defaultValue={category}>
            <option value="">All</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-ghost">Filter</button>
      </form>

      <section className="card mt-4 p-0 sm:p-2">
        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No projects match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Promotion</th>
                  <th>Status</th>
                  <th className="num">Agreed</th>
                  <th className="num">Paid</th>
                  <th className="num">Client owes</th>
                  <th className="num">Savings owed</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const t = totalsFor(totals, p.id);
                  const owes = p.status === "cancelled" ? 0 : num(p.agreed_price) - t.paid;
                  const savingsOwed = t.savingsDue - t.transferred;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/projects/${p.id}`} className="font-mono text-xs text-accent hover:underline">
                          {p.code}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap">{p.client}</td>
                      <td>
                        <Link href={`/projects/${p.id}`} className="hover:text-accent">{p.name}</Link>
                      </td>
                      <td className="whitespace-nowrap text-ink-2">{p.category ?? "—"}</td>
                      <td className="whitespace-nowrap text-ink-2">
                        {p.campaign_id ? campaignName.get(p.campaign_id) : REGULAR_CAMPAIGN}
                      </td>
                      <td className="whitespace-nowrap text-ink-2">{statusLabel(p.status)}</td>
                      <td className="num">{formatZAR(num(p.agreed_price))}</td>
                      <td className="num">{formatZAR(t.paid)}</td>
                      <td className={`num ${owes > 0.005 ? "" : "text-muted"}`}>{owes > 0.005 ? formatZAR(owes) : "—"}</td>
                      <td className={`num ${savingsOwed > 0.005 ? "text-warning" : "text-muted"}`}>
                        {savingsOwed > 0.005 ? formatZAR(savingsOwed) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
