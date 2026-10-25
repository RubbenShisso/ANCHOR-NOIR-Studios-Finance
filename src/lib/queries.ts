import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectOption } from "@/components/fields";

// Projects for dropdowns, newest code first.
export async function getProjectOptions(supabase: SupabaseClient): Promise<ProjectOption[]> {
  const { data } = await supabase
    .from("projects")
    .select("id, code, name, client")
    .order("code", { ascending: false });
  return data ?? [];
}
