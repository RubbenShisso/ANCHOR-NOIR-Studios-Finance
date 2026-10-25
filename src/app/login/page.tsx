import { ActionForm } from "@/components/action-form";
import { signIn } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent">ANCHOR NOIR STUDIOS</p>
          <h1 className="mt-2 text-2xl font-semibold">Finance</h1>
          <p className="mt-1 text-sm text-muted">Team members only</p>
        </div>
        <ActionForm action={signIn} className="card space-y-4" submitLabel="Sign in">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </ActionForm>
      </div>
    </main>
  );
}
