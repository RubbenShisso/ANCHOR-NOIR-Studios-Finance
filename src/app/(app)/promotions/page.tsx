import { ActionForm } from "@/components/action-form";
import { CampaignTable } from "@/components/campaign-table";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/auth";
import { campaignPerformance } from "@/lib/campaigns";
import { totalsByProject } from "@/lib/finance";
import { formatDate } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import { createCampaign, deleteCampaign } from "./actions";

export default async function PromotionsPage() {
  const { supabase } = await requireMember();

  const [{ data: campaignData }, { data: projects }, { data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("campaigns").select("*").order("starts_on", { ascending: false }),
    supabase.from("projects").select("id, campaign_id, agreed_price, status"),
    supabase.from("payments").select("project_id, amount, savings_due"),
    supabase.from("expenses").select("project_id, amount"),
  ]);
  const campaigns = (campaignData ?? []) as Campaign[];
  const rows = campaignPerformance(campaigns, projects ?? [], totalsByProject(payments ?? [], [], expenses ?? []));
  const period = new Map(
    campaigns.map((c) => [c.id, c.starts_on || c.ends_on ? `${formatDate(c.starts_on)} – ${formatDate(c.ends_on)}` : null]),
  );

  return (
    <>
      <PageHeader
        title="Promotions"
        subtitle="Compare promotions with regular pricing. A discount that brings more projects isn't automatically more profitable."
      />

      <section className="card p-0 sm:p-2">
        <CampaignTable
          rows={rows}
          actions={(r) =>
            r.id && (
              <span className="flex items-center justify-end gap-3">
                {period.get(r.id) && <span className="hidden text-xs text-muted lg:inline">{period.get(r.id)}</span>}
                <DeleteButton
                  action={deleteCampaign}
                  id={r.id}
                  confirmText={`Delete "${r.name}"? Its projects will count as regular pricing.`}
                />
              </span>
            )
          }
        />
      </section>

      <h2 className="mt-8 mb-3 text-sm font-semibold">Add a promotion</h2>
      <ActionForm action={createCampaign} submitLabel="Add promotion" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-name">Name</label>
          <input className="input" id="c-name" name="name" placeholder="e.g. Summer Special" required />
        </div>
        <div>
          <label className="label" htmlFor="c-start">Starts</label>
          <input className="input" id="c-start" name="starts_on" type="date" />
        </div>
        <div>
          <label className="label" htmlFor="c-end">Ends</label>
          <input className="input" id="c-end" name="ends_on" type="date" />
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <label className="label" htmlFor="c-notes">Offer details</label>
          <input className="input" id="c-notes" name="notes" placeholder="e.g. 20% off business websites" />
        </div>
      </ActionForm>
    </>
  );
}
