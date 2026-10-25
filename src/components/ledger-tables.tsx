import { deleteExpense } from "@/app/(app)/expenses/actions";
import { deletePayment } from "@/app/(app)/payments/actions";
import { deleteSavingsEntry } from "@/app/(app)/savings/actions";
import { DeleteButton } from "@/components/delete-button";
import { ProjectRef } from "@/components/fields";
import { formatDate, formatZAR, num } from "@/lib/format";
import { paymentKindLabel, savingsKindLabel, type Expense, type Payment, type SavingsEntry } from "@/lib/types";

const Empty = ({ text }: { text: string }) => <p className="py-8 text-center text-sm text-muted">{text}</p>;

export function PaymentTable({ payments, showProject = true }: { payments: Payment[]; showProject?: boolean }) {
  if (payments.length === 0) return <Empty text="No client payments recorded." />;
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            {showProject && <th>Project</th>}
            <th>Type</th>
            <th>Reference</th>
            <th className="num">Received</th>
            <th className="num">Savings %</th>
            <th className="num">Savings due</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap text-ink-2">{formatDate(p.received_on)}</td>
              {showProject && <td><ProjectRef id={p.project_id} project={p.projects} /></td>}
              <td className="whitespace-nowrap">{paymentKindLabel(p.kind)}</td>
              <td className="text-ink-2">{p.reference ?? "—"}</td>
              <td className="num">{formatZAR(num(p.amount))}</td>
              <td className="num text-ink-2">{num(p.savings_rate)}%</td>
              <td className="num">{formatZAR(num(p.savings_due))}</td>
              <td className="text-right">
                <DeleteButton action={deletePayment} id={p.id} confirmText="Delete this payment?" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SavingsTable({ entries, showProject = true }: { entries: SavingsEntry[]; showProject?: boolean }) {
  if (entries.length === 0) return <Empty text="No savings entries recorded." />;
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            {showProject && <th>Project</th>}
            <th>Reference / reason</th>
            <th className="num">Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((s) => (
            <tr key={s.id}>
              <td className="whitespace-nowrap text-ink-2">{formatDate(s.occurred_on)}</td>
              <td className="whitespace-nowrap">{savingsKindLabel(s.kind)}</td>
              {showProject && <td><ProjectRef id={s.project_id} project={s.projects} /></td>}
              <td className="text-ink-2">
                {[s.reference, s.reason, s.approved_by && `approved by ${s.approved_by}`].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className="num">
                {s.kind === "withdrawal" ? "−" : "+"}
                {formatZAR(num(s.amount))}
              </td>
              <td className="text-right">
                <DeleteButton action={deleteSavingsEntry} id={s.id} confirmText="Delete this savings entry?" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExpenseTable({ expenses, showProject = true }: { expenses: Expense[]; showProject?: boolean }) {
  if (expenses.length === 0) return <Empty text="No expenses recorded." />;
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            {showProject && <th>Project</th>}
            <th>Paid by</th>
            <th className="num">Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap text-ink-2">{formatDate(e.spent_on)}</td>
              <td className="whitespace-nowrap">{e.category}</td>
              <td className="text-ink-2">{e.description ?? "—"}</td>
              {showProject && (
                <td>{e.project_id ? <ProjectRef id={e.project_id} project={e.projects} /> : <span className="text-muted">General</span>}</td>
              )}
              <td className="text-ink-2">{e.paid_by ?? "—"}</td>
              <td className="num">{formatZAR(num(e.amount))}</td>
              <td className="text-right">
                <DeleteButton action={deleteExpense} id={e.id} confirmText="Delete this expense?" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
