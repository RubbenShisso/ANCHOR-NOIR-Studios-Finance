"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import type { FormState } from "@/lib/types";

export async function createCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireMember();

  const name = String(formData.get("name") ?? "").trim();
  const starts_on = String(formData.get("starts_on") ?? "") || null;
  const ends_on = String(formData.get("ends_on") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "Promotion name is required." };

  const { error } = await supabase.from("campaigns").insert({ name, starts_on, ends_on, notes });
  if (error) return { error: error.code === "23505" ? "A promotion with that name already exists." : error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Projects in a deleted promotion fall back to regular pricing.
export async function deleteCampaign(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return error.message;
  revalidatePath("/", "layout");
}
