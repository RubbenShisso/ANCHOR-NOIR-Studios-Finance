import { addExpense } from "@/app/(app)/expenses/actions";
import { addPayment } from "@/app/(app)/payments/actions";
import { addSavingsEntry } from "@/app/(app)/savings/actions";
import { ActionForm } from "@/components/action-form";
import { ProjectSelect, type ProjectOption } from "@/components/fields";
import { EXPENSE_CATEGORIES, PAYMENT_KINDS, SAVINGS_KINDS } from "@/lib/types";

const grid = "card grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end";

export function PaymentForm({
  projects,
  today,
  projectId,
}: {
  projects: ProjectOption[];
  today: string;
  projectId?: string;
}) {
  return (
    <ActionForm action={addPayment} submitLabel="Record payment" className={grid}>
      {projectId ? (
        <input type="hidden" name="project_id" value={projectId} />
      ) : (
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pay-project">Project</label>
          <ProjectSelect id="pay-project" projects={projects} required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="pay-kind">Payment type</label>
        <select className="input" id="pay-kind" name="kind" defaultValue="deposit">
          {PAYMENT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pay-amount">Amount received (R)</label>
        <input className="input" id="pay-amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <label className="label" htmlFor="pay-date">Date received</label>
        <input className="input" id="pay-date" name="received_on" type="date" defaultValue={today} required />
      </div>
      <div className={projectId ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-4"}>
        <label className="label" htmlFor="pay-ref">Reference / notes</label>
        <input className="input" id="pay-ref" name="reference" placeholder="e.g. EFT ref, invoice number" />
      </div>
    </ActionForm>
  );
}

export function SavingsForm({
  projects,
  today,
  projectId,
}: {
  projects: ProjectOption[];
  today: string;
  projectId?: string;
}) {
  return (
    <ActionForm action={addSavingsEntry} submitLabel="Record" className={grid}>
      <div>
        <label className="label" htmlFor="sav-kind">Type</label>
        <select className="input" id="sav-kind" name="kind" defaultValue="transfer">
          {SAVINGS_KINDS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="sav-amount">Amount (R)</label>
        <input className="input" id="sav-amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <label className="label" htmlFor="sav-date">Date</label>
        <input className="input" id="sav-date" name="occurred_on" type="date" defaultValue={today} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="sav-project">Project (for transfers)</label>
        <ProjectSelect id="sav-project" projects={projects} defaultValue={projectId} />
      </div>
      <div>
        <label className="label" htmlFor="sav-ref">Bank reference</label>
        <input className="input" id="sav-ref" name="reference" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="sav-reason">Reason (required for withdrawals)</label>
        <input className="input" id="sav-reason" name="reason" placeholder="e.g. Adobe licence renewal" />
      </div>
      <div>
        <label className="label" htmlFor="sav-approved">Approved by</label>
        <input className="input" id="sav-approved" name="approved_by" />
      </div>
    </ActionForm>
  );
}

export function ExpenseForm({
  projects,
  today,
  projectId,
}: {
  projects: ProjectOption[];
  today: string;
  projectId?: string;
}) {
  return (
    <ActionForm action={addExpense} submitLabel="Add expense" className={grid}>
      <div>
        <label className="label" htmlFor="exp-amount">Amount (R)</label>
        <input className="input" id="exp-amount" name="amount" type="number" step="0.01" min="0.01" required />
      </div>
      <div>
        <label className="label" htmlFor="exp-category">Category</label>
        <select className="input" id="exp-category" name="category">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="exp-date">Date</label>
        <input className="input" id="exp-date" name="spent_on" type="date" defaultValue={today} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="exp-project">Project</label>
        <ProjectSelect id="exp-project" projects={projects} defaultValue={projectId} emptyLabel="— General business cost —" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="label" htmlFor="exp-desc">Description</label>
        <input className="input" id="exp-desc" name="description" />
      </div>
      <div>
        <label className="label" htmlFor="exp-paid">Paid by</label>
        <input className="input" id="exp-paid" name="paid_by" placeholder="e.g. Ruben" />
      </div>
    </ActionForm>
  );
}
