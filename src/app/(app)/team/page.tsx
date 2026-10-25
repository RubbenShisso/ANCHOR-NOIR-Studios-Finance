import { ActionForm } from "@/components/action-form";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { requireMember, type Member } from "@/lib/auth";
import { addMember, removeMember } from "./actions";

export default async function TeamPage() {
  const { supabase, email, member } = await requireMember();
  const { data } = await supabase.from("team_members").select("email, role").order("email");
  const members = (data ?? []) as Member[];
  const isAdmin = member.role === "admin";

  return (
    <>
      <PageHeader title="Team" subtitle="People who can see and edit the studio's finances" />

      <section className="card p-0 sm:p-2">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email}>
                <td>{m.email}{m.email === email && <span className="ml-2 text-xs text-muted">(you)</span>}</td>
                <td className="capitalize text-ink-2">{m.role}</td>
                <td className="text-right">
                  {isAdmin && m.email !== email && (
                    <DeleteButton
                      action={removeMember}
                      id={m.email}
                      label="Remove"
                      confirmText={`Remove ${m.email} from the team?`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isAdmin && (
        <section className="mt-6">
          <h2 className="mb-1 text-sm font-semibold">Add a team member</h2>
          <p className="mb-3 text-xs text-muted">
            Adding someone here grants access. They also need a login: invite them from the Supabase
            dashboard under Authentication → Users → Invite user, using the same email.
          </p>
          <ActionForm action={addMember} submitLabel="Add member" className="card grid gap-3 sm:grid-cols-3 sm:items-end">
            <div>
              <label className="label" htmlFor="m-email">Email</label>
              <input className="input" id="m-email" name="email" type="email" required />
            </div>
            <div>
              <label className="label" htmlFor="m-role">Role</label>
              <select className="input" id="m-role" name="role">
                <option value="member">Member: can manage finances</option>
                <option value="admin">Admin: can also manage the team</option>
              </select>
            </div>
          </ActionForm>
        </section>
      )}
    </>
  );
}
