"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import type { FormState } from "@/lib/types";

export async function addExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireMember();

  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim();
  const spent_on = String(formData.get("spent_on") ?? "");
  const project_id = String(formData.get("project_id") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const paid_by = String(formData.get("paid_by") ?? "").trim() || null;

  if (!(amount > 0)) return { error: "Amount must be greater than zero." };
  if (!category) return { error: "Choose a category." };

  const { error } = await supabase
    .from("expenses")
    .insert({ amount, category, spent_on, project_id, description, paid_by });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return error.message;
  revalidatePath("/", "layout");
}
