import Link from "next/link";
import { formatMonth, lastMonths } from "@/lib/format";

export type ProjectOption = { id: string; code: string; name: string; client: string };

export function ProjectSelect({
  projects,
  name = "project_id",
  id = "project_id",
  required = false,
  defaultValue = "",
  emptyLabel = "— Not linked to a project —",
}: {
  projects: ProjectOption[];
  name?: string;
  id?: string;
  required?: boolean;
  defaultValue?: string;
  emptyLabel?: string;
}) {
  return (
    <select className="input" id={id} name={name} required={required} defaultValue={defaultValue}>
      <option value="">{required ? "Choose a project…" : emptyLabel}</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.code} · {p.client} — {p.name}
        </option>
      ))}
    </select>
  );
}

// GET form that filters a ledger page by month.
export function MonthFilter({ month, extra }: { month: string; extra?: React.ReactNode }) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label" htmlFor="f-month">Month</label>
        <select className="input" id="f-month" name="month" defaultValue={month}>
          <option value="">All time</option>
          {lastMonths(24).reverse().map((m) => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>
      </div>
      {extra}
      <button className="btn btn-ghost">Filter</button>
    </form>
  );
}

export function ProjectRef({
  id,
  project,
}: {
  id: string | null;
  project?: { code: string; name: string } | null;
}) {
  if (!id || !project) return <span className="text-muted">—</span>;
  return (
    <Link href={`/projects/${id}`} className="whitespace-nowrap hover:text-accent">
      <span className="font-mono text-xs text-accent">{project.code}</span> {project.name}
    </Link>
  );
}
