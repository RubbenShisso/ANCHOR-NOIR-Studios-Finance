import Link from "next/link";
import type { CampaignPerformance } from "@/lib/campaigns";
import { formatZAR } from "@/lib/format";

export function CampaignTable({ rows, actions }: { rows: CampaignPerformance[]; actions?: (row: CampaignPerformance) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Promotion</th>
            <th className="num">Projects</th>
            <th className="num">Agreed value</th>
            <th className="num">Avg project</th>
            <th className="num">Received</th>
            <th className="num">Savings due</th>
            <th className="num">Expenses</th>
            <th className="num">Profit</th>
            {actions && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id ?? "regular"}>
              <td className="whitespace-nowrap">
                <Link href={`/projects?campaign=${r.id ?? "regular"}`} className="hover:text-accent">{r.name}</Link>
              </td>
              <td className="num">{r.projects}</td>
              <td className="num">{formatZAR(r.agreed)}</td>
              <td className="num text-ink-2">{formatZAR(r.average)}</td>
              <td className="num">{formatZAR(r.paid)}</td>
              <td className="num">{formatZAR(r.savingsDue)}</td>
              <td className="num text-ink-2">{formatZAR(r.expenses)}</td>
              <td className="num font-medium">{formatZAR(r.profit)}</td>
              {actions && <td className="text-right">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
