/**
 * Sales service — contacts + deal pipeline (customer_contacts, customer_pipeline,
 * pipeline_stage_definitions). Mirrors the web CRM Sales hub data model.
 *
 * Joins are done in JS (fetch contacts, map by id) rather than PostgREST
 * embedding so we don't depend on FK-relationship naming.
 */
import { supabase } from "@/lib/supabase";

export type Contact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_type: string | null;
  contact_type: string | null;
  lead_source: string | null;
  tags: string[] | null;
  notes: string | null;
  lifetime_value: number | null;
  last_contacted_at: string | null;
  created_at: string | null;
};

export type Deal = {
  id: string;
  contact_id: string | null;
  title: string | null;
  description: string | null;
  stage: string | null;
  deal_value: number | null;
  probability: number | null;
  lead_temperature: string | null;
  expected_close_date: string | null;
  won_date: string | null;
  lost_date: string | null;
  service_type: string | null;
  tags: string[] | null;
  notes: string | null;
  last_activity_at: string | null;
  created_at: string | null;
  pipeline_definition_id: string | null;
  contact?: Contact | null;
};

export type Stage = {
  id: string;
  pipeline_id: string;
  key: string;
  label: string;
  probability: number | null;
  stage_order: number | null;
  is_won: boolean | null;
  is_lost: boolean | null;
  color: string | null;
};

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("customer_contacts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Contact[];
}

export async function fetchContact(id: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from("customer_contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Contact) ?? null;
}

async function contactsById(): Promise<Record<string, Contact>> {
  const contacts = await fetchContacts();
  const map: Record<string, Contact> = {};
  for (const c of contacts) map[c.id] = c;
  return map;
}

export async function fetchDeals(): Promise<Deal[]> {
  const [{ data, error }, byId] = await Promise.all([
    supabase
      .from("customer_pipeline")
      .select("*")
      .order("last_activity_at", { ascending: false, nullsFirst: false }),
    contactsById(),
  ]);
  if (error) throw error;
  return ((data ?? []) as Deal[]).map((d) => ({
    ...d,
    contact: d.contact_id ? byId[d.contact_id] ?? null : null,
  }));
}

export async function fetchDeal(id: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from("customer_pipeline")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const deal = data as Deal;
  if (deal.contact_id) deal.contact = await fetchContact(deal.contact_id);
  return deal;
}

/** Deals belonging to one customer — for the customer detail screen. */
export async function fetchDealsForContact(contactId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from("customer_pipeline")
    .select("*")
    .eq("contact_id", contactId)
    .order("last_activity_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Deal[];
}

export async function fetchSalesStages(): Promise<Stage[]> {
  // Prefer the default "sales"/"deal" pipeline; fall back to the first one.
  const { data: defs, error: defErr } = await supabase
    .from("pipeline_definitions")
    .select("id, name, is_default, kind, display_order")
    .order("display_order", { ascending: true });
  if (defErr) throw defErr;
  const list = defs ?? [];
  if (list.length === 0) return [];

  const sales =
    list.find((d: any) => d.kind === "sales" || d.kind === "deal") ??
    list.find((d: any) => d.is_default) ??
    list[0];

  const { data: stages, error: stErr } = await supabase
    .from("pipeline_stage_definitions")
    .select("*")
    .eq("pipeline_id", sales.id)
    .order("stage_order", { ascending: true });
  if (stErr) throw stErr;
  return (stages ?? []) as Stage[];
}

export async function updateDealStage(id: string, stage: string): Promise<void> {
  const { error } = await supabase
    .from("customer_pipeline")
    .update({ stage, last_activity_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export type ContactInput = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  property_address?: string | null;
  property_city?: string | null;
  property_state?: string | null;
  property_zip?: string | null;
  property_type?: string | null;
  contact_type?: string | null;
  lead_source?: string | null;
  notes?: string | null;
};

export type DealInput = {
  contact_id?: string | null;
  title?: string | null;
  service_type?: string | null;
  stage?: string | null;
  deal_value?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  notes?: string | null;
};

export async function createContact(input: ContactInput): Promise<string> {
  const { data, error } = await supabase
    .from("customer_contacts")
    .insert(input)
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateContact(
  id: string,
  patch: ContactInput
): Promise<void> {
  const { error } = await supabase
    .from("customer_contacts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createDeal(input: DealInput): Promise<string> {
  const { data, error } = await supabase
    .from("customer_pipeline")
    .insert({ ...input, last_activity_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateDeal(id: string, patch: DealInput): Promise<void> {
  const { error } = await supabase
    .from("customer_pipeline")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export function contactName(c?: Contact | null): string {
  if (!c) return "Unknown customer";
  const n = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim();
  return n || c.email || c.phone || "Unnamed customer";
}
