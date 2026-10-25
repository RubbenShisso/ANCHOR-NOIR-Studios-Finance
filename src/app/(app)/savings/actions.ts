"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { SAVINGS_KINDS, type FormState } from "@/lib/types";

export async function addSavingsEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireMember();

  const kind = String(formData.get("kind") ?? "transfer");
  const amount = Number(formData.get("amount"));
  const occurred_on = String(formData.get("occurred_on") ?? "");
  const project_id = String(formData.get("project_id") ?? "") || null;
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const approved_by = String(formData.get("approved_by") ?? "").trim() || null;

  if (!SAVINGS_KINDS.some((k) => k.value === kind)) return { error: "Choose an entry type." };
  if (!(amount > 0)) return { error: "Amount must be greater than zero." };
  if (kind === "withdrawal" && !reason) return { error: "Give a reason for the withdrawal." };

  const { error } = await supabase.from("savings_entries").insert({
    kind,
    amount,
    occurred_on,
    project_id: kind === "transfer" ? project_id : null,
    reference,
    reason,
    approved_by,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteSavingsEntry(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("savings_entries").delete().eq("id", id);
  if (error) return error.message;
  revalidatePath("/", "layout");
}
