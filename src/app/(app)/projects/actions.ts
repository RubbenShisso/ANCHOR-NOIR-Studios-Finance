"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { PROJECT_STATUSES, type FormState } from "@/lib/types";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || null;
const optionalNumber = (formData: FormData, key: string) => {
  const raw = String(formData.get(key) ?? "").trim();
  return raw === "" ? null : Number(raw);
};

function readProject(formData: FormData) {
  const client = text(formData, "client");
  const name = text(formData, "name");
  const agreed_price = Number(formData.get("agreed_price") || 0);
  const standard_price = optionalNumber(formData, "standard_price");
  const savings_rate = Number(formData.get("savings_rate") ?? 20);
  const status = String(formData.get("status") ?? "quoted");

  if (!client) return { error: "Client name is required." } as const;
  if (!name) return { error: "Project name is required." } as const;
  if (!(agreed_price >= 0)) return { error: "Agreed price can't be negative." } as const;
  if (standard_price !== null && !(standard_price >= 0)) return { error: "Standard price can't be negative." } as const;
  if (!(savings_rate >= 0 && savings_rate <= 100)) return { error: "Savings % must be between 0 and 100." } as const;
  if (!PROJECT_STATUSES.some((s) => s.value === status)) return { error: "Invalid status." } as const;

  return {
    values: {
      client,
      name,
      agreed_price,
      standard_price,
      savings_rate,
      status,
      category: text(formData, "category"),
      service: text(formData, "service"),
      campaign_id: text(formData, "campaign_id"),
      website_url: text(formData, "website_url"),
      client_industry: text(formData, "client_industry"),
      lead_source: text(formData, "lead_source"),
      start_date: text(formData, "start_date"),
      due_date: text(formData, "due_date"),
      completed_on: text(formData, "completed_on"),
      description: text(formData, "description"),
      notes: text(formData, "notes"),
    },
  } as const;
}

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireMember();
  const parsed = readProject(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await supabase.from("projects").insert(parsed.values).select("id").single();
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireMember();
  const parsed = readProject(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabase.from("projects").update(parsed.values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProject(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    // payments.project_id is ON DELETE RESTRICT: money records are never removed implicitly.
    return error.code === "23503" ? "Delete this project's client payments first." : error.message;
  }
  revalidatePath("/", "layout");
  redirect("/projects");
}
