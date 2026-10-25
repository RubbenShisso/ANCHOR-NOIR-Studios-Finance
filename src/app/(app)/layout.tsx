import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { getSession } from "@/lib/auth";
import { signOut } from "../login/actions";

// The sidebar is a static shell; anything that reads the session streams in behind Suspense.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b border-line p-4 md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="mb-4 px-3">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent">ANCHOR NOIR</p>
          <p className="text-sm font-semibold">Studios Finance</p>
        </div>
        <Suspense>
          <Nav />
        </Suspense>
        <Suspense>
          <UserBox />
        </Suspense>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <MemberGate>{children}</MemberGate>
        </Suspense>
      </main>
    </div>
  );
}

async function UserBox() {
  const { email } = await getSession();
  return (
    <div className="mt-6 hidden px-3 md:block">
      <p className="truncate text-xs text-muted">{email}</p>
      <form action={signOut}>
        <button className="mt-1 text-xs text-ink-2 hover:text-ink">Sign out</button>
      </form>
    </div>
  );
}

async function MemberGate({ children }: { children: React.ReactNode }) {
  const { email, member } = await getSession();
  if (member) return children;

  return (
    <div className="card mx-auto mt-16 max-w-md text-center">
      <h1 className="text-lg font-semibold">No access yet</h1>
      <p className="mt-2 text-sm text-ink-2">
        {email ?? "This account"} is signed in but isn&apos;t on the Anchor Noir team list. Ask an
        admin to add you on the Team page.
      </p>
      <form action={signOut} className="mt-4">
        <button className="btn btn-ghost">Sign out</button>
      </form>
    </div>
  );
}
