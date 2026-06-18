/**
 * Operations service — work orders, schedule, crews
 * (ops_work_orders, ops_schedule, ops_crews). Mirrors the web Operations hub.
 */
import { supabase } from "@/lib/supabase";
import { fetchContacts, type Contact } from "./sales";
import { uploadImage } from "@/lib/upload";

export type WorkOrderPhoto = { url: string | null; path: string; at: string };

export type WorkOrder = {
  id: string;
  title: string | null;
  description: string | null;
  work_order_number: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  contact_id: string | null;
  project_id: string | null;
  estimate_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  assigned_crew_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  estimated_duration_hours: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  completion_notes: string | null;
  before_photos: WorkOrderPhoto[] | null;
  after_photos: WorkOrderPhoto[] | null;
  created_at: string | null;
  contact?: Contact | null;
  crew?: Crew | null;
};

export type Crew = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  color: string | null;
  specialties: string[] | null;
  vehicle: string | null;
};

export type ScheduleEvent = {
  id: string;
  title: string | null;
  event_type: string | null;
  work_order_id: string | null;
  crew_id: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean | null;
  address: string | null;
  color: string | null;
  notes: string | null;
  status: string | null;
};

export async function fetchCrews(): Promise<Crew[]> {
  const { data, error } = await supabase
    .from("ops_crews")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Crew[];
}

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const [{ data, error }, contacts, crews] = await Promise.all([
    supabase
      .from("ops_work_orders")
      .select("*")
      .order("scheduled_start", { ascending: true, nullsFirst: false }),
    fetchContacts(),
    fetchCrews(),
  ]);
  if (error) throw error;
  const cById: Record<string, Contact> = {};
  for (const c of contacts) cById[c.id] = c;
  const crewById: Record<string, Crew> = {};
  for (const c of crews) crewById[c.id] = c;
  return ((data ?? []) as WorkOrder[]).map((w) => ({
    ...w,
    contact: w.contact_id ? cById[w.contact_id] ?? null : null,
    crew: w.assigned_crew_id ? crewById[w.assigned_crew_id] ?? null : null,
  }));
}

export async function fetchWorkOrder(id: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from("ops_work_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const wo = data as WorkOrder;
  if (wo.contact_id) {
    const { data: c } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("id", wo.contact_id)
      .maybeSingle();
    wo.contact = (c as Contact) ?? null;
  }
  if (wo.assigned_crew_id) {
    const { data: cr } = await supabase
      .from("ops_crews")
      .select("*")
      .eq("id", wo.assigned_crew_id)
      .maybeSingle();
    wo.crew = (cr as Crew) ?? null;
  }
  return wo;
}

/** Jobs (work orders) belonging to one customer — for the customer detail screen. */
export async function fetchWorkOrdersForContact(contactId: string): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from("ops_work_orders")
    .select("*")
    .eq("contact_id", contactId)
    .order("scheduled_start", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as WorkOrder[];
}

export const WORK_ORDER_STATUSES = [
  "new",
  "scheduled",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export async function updateWorkOrderStatus(
  id: string,
  status: string
): Promise<void> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "in_progress") patch.actual_start = new Date().toISOString();
  if (status === "completed") patch.actual_end = new Date().toISOString();
  const { error } = await supabase
    .from("ops_work_orders")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchSchedule(
  fromIso: string,
  toIso: string
): Promise<ScheduleEvent[]> {
  const { data, error } = await supabase
    .from("ops_schedule")
    .select("*")
    .gte("start_time", fromIso)
    .lte("start_time", toIso)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScheduleEvent[];
}

export function workOrderAddress(w: WorkOrder): string {
  const parts = [w.address, w.city, w.state, w.zip].filter(Boolean);
  return parts.join(", ") || "No address";
}

// ── Create / edit ───────────────────────────────────────────────────────────

export type WorkOrderInput = {
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  contact_id?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  assigned_crew_id?: string | null;
  scheduled_start?: string | null;
  estimated_duration_hours?: number | null;
  estimated_cost?: number | null;
  notes?: string | null;
};

export async function createWorkOrder(input: WorkOrderInput): Promise<string> {
  const { data, error } = await supabase
    .from("ops_work_orders")
    .insert({
      ...input,
      status: input.status ?? "new",
      work_order_number: `WO-${Date.now().toString().slice(-6)}`,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateWorkOrder(
  id: string,
  patch: WorkOrderInput
): Promise<void> {
  const { error } = await supabase
    .from("ops_work_orders")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Upload a job photo (base64) to the private bucket and append it to the WO. */
export async function addWorkOrderPhoto(
  id: string,
  phase: "before" | "after",
  base64: string
): Promise<void> {
  const col = phase === "before" ? "before_photos" : "after_photos";
  const up = await uploadImage("job-photos", `wo/${id}/${phase}-${Date.now()}.jpg`, base64, "image/jpeg");
  const { data, error: selErr } = await supabase
    .from("ops_work_orders")
    .select(col)
    .eq("id", id)
    .single();
  if (selErr) throw selErr;
  const existing = Array.isArray((data as any)?.[col]) ? (data as any)[col] : [];
  const next = [...existing, { url: up.signedUrl, path: up.path, at: new Date().toISOString() }];
  const { error } = await supabase
    .from("ops_work_orders")
    .update({ [col]: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
