/** Org settings — the singleton company-profile row in org_settings. */
import { supabase } from "@/lib/supabase";

export type OrgSettings = {
  id: string;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_website: string | null;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_zip: string | null;
  license_number: string | null;
  primary_color: string | null;
  accent_color: string | null;
};

export async function fetchOrgSettings(): Promise<OrgSettings | null> {
  const { data, error } = await supabase
    .from("org_settings")
    .select(
      "id, company_name, company_email, company_phone, company_website, company_address, company_city, company_state, company_zip, license_number, primary_color, accent_color"
    )
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as OrgSettings) ?? null;
}

export async function updateOrgSettings(
  id: string,
  patch: Partial<OrgSettings>
): Promise<void> {
  const { error } = await supabase
    .from("org_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
