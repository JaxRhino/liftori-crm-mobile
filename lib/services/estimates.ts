/**
 * Estimates service — customer_estimates incl. the field e-sign flow.
 *
 * "Sign" in Phase 1 = an audited typed sign-off: signer name + consent +
 * timestamp + IP, writing esign_status='signed'. (A drawn-signature canvas is a
 * fast follow that needs a native dep + APK rebuild — see README.)
 */
import { supabase } from "@/lib/supabase";
import { fetchContacts, type Contact } from "./sales";

export type EstimateLineItem = {
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total?: number;
  [k: string]: unknown;
};

export type Estimate = {
  id: string;
  contact_id: string | null;
  project_id: string | null;
  estimate_number: string | null;
  title: string | null;
  description: string | null;
  line_items: EstimateLineItem[] | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total: number | null;
  status: string | null;
  esign_status: string | null;
  esign_sent_at: string | null;
  esign_signed_at: string | null;
  signer_name: string | null;
  signer_ip: string | null;
  signature_url: string | null;
  valid_until: string | null;
  sent_at: string | null;
  notes: string | null;
  terms: string | null;
  intro: string | null;
  created_at: string | null;
  contact?: Contact | null;
};

export async function fetchEstimates(): Promise<Estimate[]> {
  const [{ data, error }, contacts] = await Promise.all([
    supabase
      .from("customer_estimates")
      .select("*")
      .order("created_at", { ascending: false }),
    fetchContacts(),
  ]);
  if (error) throw error;
  const byId: Record<string, Contact> = {};
  for (const c of contacts) byId[c.id] = c;
  return ((data ?? []) as Estimate[]).map((e) => ({
    ...e,
    contact: e.contact_id ? byId[e.contact_id] ?? null : null,
  }));
}

export async function fetchEstimate(id: string): Promise<Estimate | null> {
  const { data, error } = await supabase
    .from("customer_estimates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const est = data as Estimate;
  if (est.contact_id) {
    const { data: c } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("id", est.contact_id)
      .maybeSingle();
    est.contact = (c as Contact) ?? null;
  }
  return est;
}

async function clientIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const json = (await res.json()) as { ip?: string };
    return json.ip ?? null;
  } catch {
    return null;
  }
}

/**
 * Record an audited signature on an estimate: name + consent + server timestamp
 * + IP, and an optional drawn-signature image (PNG base64) uploaded to the
 * private `signatures` bucket. NOTE: client IP is best-effort/spoofable — move
 * to a server-side edge function for legally-robust attribution (security gate).
 */
export async function signEstimate(
  id: string,
  signerName: string,
  signatureBase64?: string | null
): Promise<void> {
  const ip = await clientIp();
  const now = new Date().toISOString();

  let signature_url: string | null = null;
  if (signatureBase64) {
    const { uploadImage } = await import("@/lib/upload");
    const up = await uploadImage("signatures", `estimates/${id}/${Date.now()}.png`, signatureBase64);
    signature_url = up.signedUrl;
  }

  const { error } = await supabase
    .from("customer_estimates")
    .update({
      esign_status: "signed",
      esign_signed_at: now,
      signer_name: signerName.trim(),
      signer_ip: ip,
      ...(signature_url ? { signature_url } : {}),
      status: "accepted",
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Mark an estimate as sent (sets esign_status='sent' so it shows as pending). */
export async function markEstimateSent(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("customer_estimates")
    .update({
      status: "sent",
      esign_status: "sent",
      esign_sent_at: now,
      sent_at: now,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw error;
}

export function isSigned(e: Pick<Estimate, "esign_status">): boolean {
  return (e.esign_status ?? "").toLowerCase() === "signed";
}

// ── Builder (create / edit) ─────────────────────────────────────────────────

export type EstimateInput = {
  contact_id?: string | null;
  title?: string | null;
  description?: string | null;
  line_items: EstimateLineItem[];
  tax_rate?: number | null;
  discount_amount?: number | null;
  valid_until?: string | null;
  notes?: string | null;
  terms?: string | null;
};

export type EstimateTemplate = {
  id: string;
  name: string | null;
  service_type: string | null;
  default_tax_rate: number | null;
  default_terms: string | null;
  default_notes: string | null;
};

/** Compute subtotal / tax / total from line items + rate + discount. */
export function computeTotals(
  items: EstimateLineItem[],
  taxRate: number,
  discount: number
) {
  const subtotal = items.reduce((s, it) => {
    const qty = Number(it.quantity ?? 1);
    const price = Number(it.unit_price ?? 0);
    return s + (it.total != null ? Number(it.total) : qty * price);
  }, 0);
  const taxable = Math.max(0, subtotal - (discount || 0));
  const tax_amount = +(taxable * (taxRate || 0) / 100).toFixed(2);
  const total = +(taxable + tax_amount).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), tax_amount, total };
}

function payload(input: EstimateInput) {
  const items = (input.line_items ?? []).map((it) => {
    const qty = Number(it.quantity ?? 1);
    const price = Number(it.unit_price ?? 0);
    return { ...it, quantity: qty, unit_price: price, total: +(qty * price).toFixed(2) };
  });
  const { subtotal, tax_amount, total } = computeTotals(
    items,
    Number(input.tax_rate ?? 0),
    Number(input.discount_amount ?? 0)
  );
  return {
    contact_id: input.contact_id ?? null,
    title: input.title?.trim() || "Estimate",
    description: input.description ?? null,
    line_items: items,
    subtotal,
    tax_rate: Number(input.tax_rate ?? 0),
    tax_amount,
    discount_amount: Number(input.discount_amount ?? 0),
    total,
    valid_until: input.valid_until || null,
    notes: input.notes ?? null,
    terms: input.terms ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function createEstimate(input: EstimateInput): Promise<string> {
  const { data, error } = await supabase
    .from("customer_estimates")
    .insert({ ...payload(input), status: "draft", esign_status: "draft" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateEstimate(
  id: string,
  input: EstimateInput
): Promise<void> {
  const { error } = await supabase
    .from("customer_estimates")
    .update(payload(input))
    .eq("id", id);
  if (error) throw error;
}

export async function fetchEstimateTemplates(): Promise<EstimateTemplate[]> {
  const { data, error } = await supabase
    .from("estimate_templates")
    .select("id, name, service_type, default_tax_rate, default_terms, default_notes")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EstimateTemplate[];
}

export async function fetchTemplateItems(
  templateId: string
): Promise<EstimateLineItem[]> {
  const { data, error } = await supabase
    .from("estimate_template_items")
    .select("name, description, quantity, unit, unit_price")
    .eq("template_id", templateId)
    .order("step_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((it: any) => {
    const qty = Number(it.quantity ?? 1);
    const price = Number(it.unit_price ?? 0);
    return {
      name: it.name,
      description: it.description,
      quantity: qty,
      unit: it.unit ?? "ea",
      unit_price: price,
      total: +(qty * price).toFixed(2),
    } as EstimateLineItem;
  });
}
