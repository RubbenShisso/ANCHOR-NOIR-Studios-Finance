import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Member = { email: string; role: "admin" | "member" };

// Returns the signed-in user's Supabase client and team membership.
// `member` is null when the user is signed in but not on the team list.
// Cached so the layout and page share one lookup per request.
export const getSession = cache(async () => {
  // getClaims() checks token expiry against the clock, so opt into request-time rendering first.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined)?.toLowerCase() ?? null;

  if (!email) return { supabase, email: null, member: null };

  const { data: member } = await supabase
    .from("team_members")
    .select("email, role")
    .eq("email", email)
    .maybeSingle<Member>();

  return { supabase, email, member };
});

// Use at the top of every server action. RLS enforces the same rule in the database.
export async function requireMember() {
  const session = await getSession();
  if (!session.member) throw new Error("Not authorised");
  return { ...session, member: session.member };
}

export async function requireAdmin() {
  const session = await requireMember();
  if (session.member.role !== "admin") throw new Error("Admins only");
  return session;
}
