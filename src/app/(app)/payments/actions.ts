"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { PAYMENT_KINDS, type FormState } from "@/lib/types";

export async function addPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireMember();

  const project_id = String(formData.get("project_id") ?? "");
  const kind = String(formData.get("kind") ?? "deposit");
  const amount = Number(formData.get("amount"));
  const received_on = String(formData.get("received_on") ?? "");
  const reference = String(formData.get("reference") ?? "").trim() || null;

  if (!project_id) return { error: "Choose the project this payment is for." };
  if (!PAYMENT_KINDS.some((k) => k.value === kind)) return { error: "Choose a payment type." };
  if (!(amount > 0)) return { error: "Amount must be greater than zero." };

  // savings_rate is left out so the database copies it from the project.
  const { error } = await supabase.from("payments").insert({ project_id, kind, amount, received_on, reference });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePayment(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return error.message;
  revalidatePath("/", "layout");
}
