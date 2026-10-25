"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { FormState } from "@/lib/types";

export async function addMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role") === "admin" ? "admin" : "member";
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  const { error } = await supabase.from("team_members").upsert({ email, role });
  if (error) return { error: error.message };

  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(email: string) {
  const { supabase, email: self } = await requireAdmin();
  if (email === self) return "You can't remove yourself.";

  const { error } = await supabase.from("team_members").delete().eq("email", email);
  if (error) return error.message;
  revalidatePath("/team");
}
