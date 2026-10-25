import {
  LEAD_SOURCES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  type Campaign,
  type Project,
} from "@/lib/types";

// Shared inputs for the create and edit project forms.
// Everyday fields first; the rest sit under "More details".
export function ProjectFields({ project, campaigns }: { project?: Project; campaigns: Campaign[] }) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="client">Client</label>
        <input className="input" id="client" name="client" defaultValue={project?.client} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Project</label>
        <input className="input" id="name" name="name" defaultValue={project?.name} placeholder="e.g. Business website" required />
      </div>
      <div>
        <label className="label" htmlFor="category">Category</label>
        <select className="input" id="category" name="category" defaultValue={project?.category ?? ""}>
          <option value="">—</option>
          {PROJECT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="agreed_price">Agreed price (R)</label>
        <input
          className="input"
          id="agreed_price"
          name="agreed_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={project?.agreed_price ?? ""}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="savings_rate">Savings %</label>
        <input
          className="input"
          id="savings_rate"
          name="savings_rate"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={project?.savings_rate ?? 20}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="campaign_id">Promotion</label>
        <select className="input" id="campaign_id" name="campaign_id" defaultValue={project?.campaign_id ?? ""}>
          <option value="">Regular pricing</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="status">Status</label>
        <select className="input" id="status" name="status" defaultValue={project?.status ?? "quoted"}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="start_date">Start / agreed date</label>
        <input className="input" id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? ""} />
      </div>

      <details className="sm:col-span-2 lg:col-span-4" open={Boolean(project)}>
        <summary className="cursor-pointer text-xs font-medium text-ink-2">More details</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="service">Package / service</label>
            <input className="input" id="service" name="service" defaultValue={project?.service ?? ""} placeholder="e.g. 5-page business website" />
          </div>
          <div>
            <label className="label" htmlFor="standard_price">Standard price (R)</label>
            <input
              className="input"
              id="standard_price"
              name="standard_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={project?.standard_price ?? ""}
              placeholder="Before promo discount"
            />
          </div>
          <div>
            <label className="label" htmlFor="lead_source">Lead source</label>
            <select className="input" id="lead_source" name="lead_source" defaultValue={project?.lead_source ?? ""}>
              <option value="">—</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="website_url">Website URL</label>
            <input className="input" id="website_url" name="website_url" type="url" defaultValue={project?.website_url ?? ""} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="client_industry">Client industry</label>
            <input className="input" id="client_industry" name="client_industry" defaultValue={project?.client_industry ?? ""} placeholder="e.g. Logistics" />
          </div>
          <div>
            <label className="label" htmlFor="due_date">Due date</label>
            <input className="input" id="due_date" name="due_date" type="date" defaultValue={project?.due_date ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="completed_on">Completed on</label>
            <input className="input" id="completed_on" name="completed_on" type="date" defaultValue={project?.completed_on ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">Description / scope</label>
            <input className="input" id="description" name="description" defaultValue={project?.description ?? ""} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="label" htmlFor="notes">Notes</label>
            <input className="input" id="notes" name="notes" defaultValue={project?.notes ?? ""} />
          </div>
        </div>
      </details>
    </>
  );
}
