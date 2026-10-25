import { totalsFor, type ProjectTotals } from "@/lib/finance";
import { num } from "@/lib/format";
import { REGULAR_CAMPAIGN, type Campaign } from "@/lib/types";

type ProjectRow = { id: string; campaign_id: string | null; agreed_price: number | string; status: string };

export type CampaignPerformance = {
  id: string | null;
  name: string;
  projects: number;
  agreed: number;
  paid: number;
  savingsDue: number;
  expenses: number;
  profit: number;
  average: number;
};

// One row per promotion plus "Regular pricing", ignoring cancelled projects.
export function campaignPerformance(
  campaigns: Campaign[],
  projects: ProjectRow[],
  totals: Map<string, ProjectTotals>,
): CampaignPerformance[] {
  const groups: { id: string | null; name: string }[] = [
    { id: null, name: REGULAR_CAMPAIGN },
    ...campaigns.map((c) => ({ id: c.id, name: c.name })),
  ];

  return groups.map(({ id, name }) => {
    const rows = projects.filter((p) => p.campaign_id === id && p.status !== "cancelled");
    const agg = rows.reduce(
      (acc, p) => {
        const t = totalsFor(totals, p.id);
        acc.agreed += num(p.agreed_price);
        acc.paid += t.paid;
        acc.savingsDue += t.savingsDue;
        acc.expenses += t.expenses;
        return acc;
      },
      { agreed: 0, paid: 0, savingsDue: 0, expenses: 0 },
    );
    return {
      id,
      name,
      projects: rows.length,
      ...agg,
      profit: agg.paid - agg.expenses,
      average: rows.length ? agg.agreed / rows.length : 0,
    };
  });
}
