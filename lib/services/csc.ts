/**
 * CSC service — kitchen-exhaust-cleaning (industry 'kec') field flow.
 *
 * ADDITIVE ONLY. This module is imported lazily only on the CSC code path
 * (gated on tenantConfig.platformId === CSC_PLATFORM_ID). It never touches the
 * RoofX tables (ops_work_orders, customer_estimates, …) and the RoofX path
 * never imports anything here.
 *
 * Real csc_ schema (CSC project spgainjpxualjtbatfmk). Columns are used exactly
 * as they exist — do NOT invent columns/enums. Joins are done in JS (mirrors the
 * shell's operations.ts pattern). A signed/certified cleaning is treated as
 * immutable by the UI.
 *
 * NFPA-96 grease thresholds (depth of measured grease):
 *   >= 0.125"  mandatory cleaning (exceeded_threshold = true)
 *   >= 0.078"  advisory
 *   <  0.078"  within limits
 */
import { supabase } from "@/lib/supabase";

// ── NFPA-96 thresholds ───────────────────────────────────────────────────────

export const GREASE_THRESHOLD_MANDATORY = 0.125;
export const GREASE_THRESHOLD_ADVISORY = 0.078;

export type GreaseLevel = "ok" | "advisory" | "mandatory";

/** Classify a grease depth (inches) against the NFPA-96 thresholds. */
export function greaseLevel(depthInches: number | null | undefined): GreaseLevel {
  const v = Number(depthInches ?? 0);
  if (v >= GREASE_THRESHOLD_MANDATORY) return "mandatory";
  if (v >= GREASE_THRESHOLD_ADVISORY) return "advisory";
  return "ok";
}

/** True when a grease depth crosses the mandatory-cleaning threshold. */
export function exceedsThreshold(depthInches: number | null | undefined): boolean {
  return greaseLevel(depthInches) === "mandatory";
}

// ── Defensive enums ──────────────────────────────────────────────────────────

export const CLEANING_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type CleaningStatus = (typeof CLEANING_STATUSES)[number];

/** Coerce an unknown status string to a known one (defaults to 'scheduled'). */
export function normalizeStatus(s: string | null | undefined): CleaningStatus {
  const v = (s ?? "").toLowerCase();
  return (CLEANING_STATUSES as readonly string[]).includes(v)
    ? (v as CleaningStatus)
    : "scheduled";
}

export const STICKER_STATUSES = ["active", "replaced", "void"] as const;
export const DEFICIENCY_SEVERITIES = ["low", "medium", "high", "critical"] as const;

/**
 * Hood sections used for the required-photo grid. Each section gets a
 * before + after slot. These are display constants, not DB enums — the
 * hood_section / required_slot columns are free text.
 */
export const HOOD_SECTIONS = [
  "Hood",
  "Plenum",
  "Filters",
  "Duct",
  "Fan",
  "Rooftop",
] as const;
export type HoodSection = (typeof HOOD_SECTIONS)[number];

export const PHOTO_SLOTS = ["before", "after"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

/** Default NFPA-96 inspection checklist used when csc_cleanings.checklist is empty. */
export const DEFAULT_CHECKLIST_ITEMS = [
  "Access panels removed",
  "Hood interior cleaned to bare metal",
  "Plenum cleaned",
  "Filters removed and cleaned / replaced",
  "Ductwork cleaned",
  "Exhaust fan / rooftop unit cleaned",
  "Grease cup emptied",
  "Fan belt and hinge kit inspected",
  "Access panels re-secured",
  "Work area cleaned up",
] as const;

export type ChecklistItem = { label: string; done: boolean };

/** Read csc_cleanings.checklist (jsonb) into a normalized toggle list. */
export function readChecklist(raw: unknown): ChecklistItem[] {
  // Stored as an array of {label, done} objects.
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((it: any) => ({
      label: String(it?.label ?? it?.name ?? it ?? ""),
      done: Boolean(it?.done ?? it?.checked ?? false),
    }));
  }
  // Or as a flat { "Hood interior": true, ... } map.
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return Object.entries(raw as Record<string, unknown>).map(([label, done]) => ({
      label,
      done: Boolean(done),
    }));
  }
  return DEFAULT_CHECKLIST_ITEMS.map((label) => ({ label, done: false }));
}

// ── Types (real columns only) ────────────────────────────────────────────────

export type CscRestaurant = {
  id: string;
  name: string | null;
  chain_group_id: string | null;
  location_label: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_role: string | null;
  cooking_volume: string | null;
  frequency_tier: string | null;
  ahj_jurisdiction_id: string | null;
  status: string | null;
  contract_start_date: string | null;
  base_price_per_visit: number | null;
  last_cleaned_at: string | null;
  next_due_at: string | null;
  last_grease_depth_inches: number | null;
  latitude: number | null;
  longitude: number | null;
  hood_count: number | null;
  duct_length_feet: number | null;
  rooftop_access_notes: string | null;
  insurance_carrier: string | null;
  portal_token: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  ahj_enrolled: boolean | null;
  ahj_enrolled_at: string | null;
};

export type CscCleaning = {
  id: string;
  restaurant_id: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  status: string | null;
  tech_id: string | null;
  tech_name: string | null;
  supervisor_id: string | null;
  supervisor_name: string | null;
  grease_depth_pre_inches: number | null;
  grease_depth_post_inches: number | null;
  exceeded_threshold: boolean | null;
  areas_not_accessible: string | null;
  signature_manager_name: string | null;
  signature_url: string | null;
  signature_at: string | null;
  notes: string | null;
  checklist: unknown;
  certificate_id: string | null;
  sticker_id: string | null;
  job_price: number | null;
  invoice_id: string | null;
  next_cleaning_id: string | null;
  prev_cleaning_id: string | null;
  customer_window_confirmed: boolean | null;
  customer_window_confirmed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined-in-JS:
  restaurant?: CscRestaurant | null;
  photos?: CscCleaningPhoto[];
  deficiencies?: CscDeficiency[];
};

export type CscCleaningPhoto = {
  id: string;
  cleaning_id: string | null;
  photo_type: string | null;
  storage_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  hood_section: string | null;
  required_slot: string | null;
  taken_at: string | null;
  latitude: number | null;
  longitude: number | null;
  exif_metadata: unknown;
  photo_order: number | null;
  created_at: string | null;
};

export type CscCertificate = {
  id: string;
  cleaning_id: string | null;
  restaurant_id: string | null;
  cert_number: string | null;
  issued_at: string | null;
  expires_at: string | null;
  pdf_url: string | null;
  pdf_size_bytes: number | null;
  qr_code: string | null;
  public_verify_url: string | null;
  tech_name: string | null;
  supervisor_name: string | null;
  grease_depth_pre_inches: number | null;
  grease_depth_post_inches: number | null;
  ansi_iks_refs: unknown;
  areas_not_accessible: string | null;
  ahj_jurisdiction_id: string | null;
  ahj_submitted_at: string | null;
  ahj_submission_method: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CscSticker = {
  id: string;
  cleaning_id: string | null;
  certificate_id: string | null;
  qr_code: string | null;
  hood_location: string | null;
  placed_at: string | null;
  placed_by_tech_id: string | null;
  batch_number: string | null;
  status: string | null;
  replacement_sticker_id: string | null;
  notes: string | null;
  created_at: string | null;
};

export type CscDeficiency = {
  id: string;
  cleaning_id: string | null;
  restaurant_id: string | null;
  title: string | null;
  description: string | null;
  severity: string | null;
  nfpa_code_ref: string | null;
  ansi_iks_ref: string | null;
  hood_section: string | null;
  photo_url: string | null;
  video_url: string | null;
  quote_amount: number | null;
  quote_description: string | null;
  quote_status: string | null;
  quoted_at: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  resolved_at: string | null;
  resolved_in_cleaning_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CscAhj = {
  id: string;
  name: string | null;
  jurisdiction_type: string | null;
  state: string | null;
  county: string | null;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  web_portal_url: string | null;
  accepts_digital_certs: boolean | null;
  notes: string | null;
  slug: string | null;
  portal_token: string | null;
};

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchRestaurants(): Promise<CscRestaurant[]> {
  const { data, error } = await supabase
    .from("csc_restaurants")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CscRestaurant[];
}

/** List cleanings, ordered by scheduled_at, with restaurant joined in JS. */
export async function fetchCleanings(): Promise<CscCleaning[]> {
  const [{ data, error }, restaurants] = await Promise.all([
    supabase
      .from("csc_cleanings")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    fetchRestaurants(),
  ]);
  if (error) throw error;
  const byId: Record<string, CscRestaurant> = {};
  for (const r of restaurants) byId[r.id] = r;
  return ((data ?? []) as CscCleaning[]).map((c) => ({
    ...c,
    restaurant: c.restaurant_id ? byId[c.restaurant_id] ?? null : null,
  }));
}

/** Single cleaning + restaurant + photos + open deficiencies (joins in JS). */
export async function fetchCleaning(id: string): Promise<CscCleaning | null> {
  const { data, error } = await supabase
    .from("csc_cleanings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const cleaning = data as CscCleaning;

  const [restaurantRes, photosRes, deficienciesRes] = await Promise.all([
    cleaning.restaurant_id
      ? supabase
          .from("csc_restaurants")
          .select("*")
          .eq("id", cleaning.restaurant_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    supabase
      .from("csc_cleaning_photos")
      .select("*")
      .eq("cleaning_id", id)
      .order("photo_order", { ascending: true, nullsFirst: true }),
    supabase
      .from("csc_deficiencies")
      .select("*")
      .eq("cleaning_id", id)
      .order("created_at", { ascending: false }),
  ]);

  cleaning.restaurant = (restaurantRes.data as CscRestaurant) ?? null;
  cleaning.photos = (photosRes.data ?? []) as CscCleaningPhoto[];
  cleaning.deficiencies = (deficienciesRes.data ?? []) as CscDeficiency[];
  return cleaning;
}

export async function fetchAhjJurisdictions(): Promise<CscAhj[]> {
  const { data, error } = await supabase
    .from("csc_ahj_jurisdictions")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CscAhj[];
}

export async function fetchCertificate(id: string): Promise<CscCertificate | null> {
  const { data, error } = await supabase
    .from("csc_certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as CscCertificate) ?? null;
}

export async function fetchSticker(id: string): Promise<CscSticker | null> {
  const { data, error } = await supabase
    .from("csc_stickers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as CscSticker) ?? null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Guard: a signed/certified cleaning is immutable. Throws if mutation attempted. */
function assertEditable(c: Pick<CscCleaning, "certificate_id" | "signature_at" | "status">) {
  if (c.certificate_id || c.signature_at || normalizeStatus(c.status) === "completed") {
    throw new Error("This cleaning is certified and can no longer be edited.");
  }
}

export async function updateCleaningChecklist(
  id: string,
  checklist: ChecklistItem[]
): Promise<void> {
  const { error } = await supabase
    .from("csc_cleanings")
    .update({ checklist, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Save pre/post grease depth and recompute exceeded_threshold (NFPA-96). */
export async function updateGreaseDepth(
  id: string,
  pre: number | null,
  post: number | null
): Promise<void> {
  // exceeded_threshold reflects the PRE-cleaning measurement (what triggered
  // the mandatory clean). Post is recorded for the certificate / audit.
  const exceeded = exceedsThreshold(pre);
  const { error } = await supabase
    .from("csc_cleanings")
    .update({
      grease_depth_pre_inches: pre,
      grease_depth_post_inches: post,
      exceeded_threshold: exceeded,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

// ── Photo upload (Supabase Storage 'cleaning-photos') ────────────────────────

export type PhotoUploadFile = {
  /** ArrayBuffer / Blob / Uint8Array body to upload. */
  body: ArrayBuffer | Blob | Uint8Array;
  /** Image mime, e.g. 'image/jpeg'. */
  contentType: string;
  /** File extension WITHOUT the dot, e.g. 'jpg'. */
  ext: string;
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Upload one cleaning photo to the 'cleaning-photos' bucket and insert a
 * csc_cleaning_photos row. required_slot encodes "<HoodSection>:<before|after>"
 * so completeness can be computed against the required grid.
 */
export async function uploadCleaningPhoto(
  cleaningId: string,
  slot: PhotoSlot,
  hoodSection: HoodSection,
  file: PhotoUploadFile
): Promise<CscCleaningPhoto> {
  const slotKey = `${hoodSection}:${slot}`; // e.g. "Hood:before"
  const path = `${cleaningId}/${slotKey.replace(":", "_")}_${Date.now()}.${file.ext}`;

  const { error: upErr } = await supabase.storage
    .from("cleaning-photos")
    .upload(path, file.body as any, {
      contentType: file.contentType,
      upsert: true,
    });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from("cleaning-photos").getPublicUrl(path);
  const storageUrl = pub?.publicUrl ?? path;

  // photo_order: append after existing photos for this cleaning.
  const { count } = await supabase
    .from("csc_cleaning_photos")
    .select("id", { count: "exact", head: true })
    .eq("cleaning_id", cleaningId);

  const { data, error } = await supabase
    .from("csc_cleaning_photos")
    .insert({
      cleaning_id: cleaningId,
      photo_type: slot, // 'before' | 'after'
      storage_url: storageUrl,
      hood_section: hoodSection,
      required_slot: slotKey,
      photo_order: count ?? 0,
      taken_at: new Date().toISOString(),
      latitude: file.latitude ?? null,
      longitude: file.longitude ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CscCleaningPhoto;
}

/**
 * Compute required-photo completeness. Every HOOD_SECTIONS x PHOTO_SLOTS cell
 * must have at least one photo before close-out is allowed.
 */
export type PhotoCompleteness = {
  filled: Set<string>; // "Hood:before" keys present
  missing: string[];
  total: number;
  done: number;
  complete: boolean;
};

export function photoCompleteness(photos: CscCleaningPhoto[]): PhotoCompleteness {
  const filled = new Set<string>();
  for (const p of photos) {
    if (p.required_slot) filled.add(p.required_slot);
  }
  const missing: string[] = [];
  for (const section of HOOD_SECTIONS) {
    for (const slot of PHOTO_SLOTS) {
      const key = `${section}:${slot}`;
      if (!filled.has(key)) missing.push(key);
    }
  }
  const total = HOOD_SECTIONS.length * PHOTO_SLOTS.length;
  const done = total - missing.length;
  return { filled, missing, total, done, complete: missing.length === 0 };
}

// ── Close-out: signature → certificate → sticker (the demo wow) ──────────────

/** Days a certificate is valid for, by restaurant frequency_tier. */
function intervalDaysForFrequency(tier: string | null | undefined): number {
  const v = (tier ?? "").toLowerCase();
  if (v.includes("month") || v === "1" || v.includes("monthly")) return 30;
  if (v.includes("quarter") || v === "3" || v.includes("quarterly")) return 90;
  if (v.includes("semi") || v.includes("6") || v.includes("biannual")) return 182;
  if (v.includes("year") || v.includes("annual") || v === "12") return 365;
  // Default to quarterly — the most common NFPA-96 moderate-volume cadence.
  return 90;
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Generate a certificate number like CSC-20260618-AB12CD. */
export function generateCertNumber(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `CSC-${y}${m}${d}-${shortId()}`;
}

export type CloseOutInput = {
  managerName: string;
  areasNotAccessible?: string | null;
};

export type CloseOutResult = {
  cleaning: CscCleaning;
  certificate: CscCertificate;
  sticker: CscSticker;
};

/**
 * Close out a cleaning: record the manager typed-signature, mark completed,
 * mint a certificate + QR sticker, and link them back onto the cleaning.
 *
 * NOTE (Wave 2 TODO): the actual certificate PDF (pdf_url / pdf_size_bytes) and
 * the AI grease estimate are generated by Supabase edge functions, NOT here.
 * We leave pdf_url null and let the public_verify_url + QR carry the proof for
 * the demo. Do not fabricate a PDF client-side.
 */
export async function closeOutCleaning(
  id: string,
  input: CloseOutInput
): Promise<CloseOutResult> {
  const existing = await fetchCleaning(id);
  if (!existing) throw new Error("Cleaning not found.");
  assertEditable(existing);

  const now = new Date();
  const nowIso = now.toISOString();
  const restaurant = existing.restaurant ?? null;
  const certNumber = generateCertNumber(now);
  const expiresAt = new Date(
    now.getTime() + intervalDaysForFrequency(restaurant?.frequency_tier) * 86_400_000
  ).toISOString();
  // Public verification surface for the QR code (resolved by the CSC web app).
  const verifyUrl = `https://verify.liftori.ai/csc/${certNumber}`;

  // 1) Mint the certificate (copy depths / areas / tech / supervisor).
  const { data: certRow, error: certErr } = await supabase
    .from("csc_certificates")
    .insert({
      cleaning_id: id,
      restaurant_id: existing.restaurant_id,
      cert_number: certNumber,
      issued_at: nowIso,
      expires_at: expiresAt,
      qr_code: certNumber,
      public_verify_url: verifyUrl,
      tech_name: existing.tech_name,
      supervisor_name: existing.supervisor_name,
      grease_depth_pre_inches: existing.grease_depth_pre_inches,
      grease_depth_post_inches: existing.grease_depth_post_inches,
      areas_not_accessible: input.areasNotAccessible ?? existing.areas_not_accessible,
      ahj_jurisdiction_id: restaurant?.ahj_jurisdiction_id ?? null,
    })
    .select("*")
    .single();
  if (certErr) throw certErr;
  const certificate = certRow as CscCertificate;

  // 2) Mint the QR sticker (placed on the hood).
  const { data: stickerRow, error: stickerErr } = await supabase
    .from("csc_stickers")
    .insert({
      cleaning_id: id,
      certificate_id: certificate.id,
      qr_code: certNumber,
      hood_location: restaurant?.location_label ?? "Main hood",
      placed_at: nowIso,
      placed_by_tech_id: existing.tech_id,
      status: "active",
    })
    .select("*")
    .single();
  if (stickerErr) throw stickerErr;
  const sticker = stickerRow as CscSticker;

  // 3) Seal the cleaning: signature + completed + link cert/sticker.
  const { data: cleaningRow, error: cleaningErr } = await supabase
    .from("csc_cleanings")
    .update({
      status: "completed",
      completed_at: nowIso,
      signature_manager_name: input.managerName.trim(),
      signature_at: nowIso,
      areas_not_accessible: input.areasNotAccessible ?? existing.areas_not_accessible,
      certificate_id: certificate.id,
      sticker_id: sticker.id,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (cleaningErr) throw cleaningErr;

  return { cleaning: cleaningRow as CscCleaning, certificate, sticker };
}

/** Submit a certificate to the Authority Having Jurisdiction (fire marshal). */
export async function pushToAhj(certId: string, ahjId: string): Promise<void> {
  const { error } = await supabase
    .from("csc_certificates")
    .update({
      ahj_jurisdiction_id: ahjId,
      ahj_submitted_at: new Date().toISOString(),
      ahj_submission_method: "app",
      updated_at: new Date().toISOString(),
    })
    .eq("id", certId);
  if (error) throw error;
}

// ── Display helpers ──────────────────────────────────────────────────────────

export function restaurantAddress(r: CscRestaurant | null | undefined): string {
  if (!r) return "No address";
  const parts = [r.address_line1, r.address_line2, r.city, r.state, r.zip].filter(Boolean);
  return parts.join(", ") || "No address";
}

export function restaurantLabel(r: CscRestaurant | null | undefined): string {
  if (!r) return "Unknown site";
  return [r.name, r.location_label].filter(Boolean).join(" · ") || "Unknown site";
}

/** Open (unresolved) deficiencies for the prior-issues list. */
export function openDeficiencies(defs: CscDeficiency[] | undefined): CscDeficiency[] {
  return (defs ?? []).filter((d) => !d.resolved_at);
}

/*
 * Wave 2 TODOs (edge functions, NOT implemented here — do not fabricate):
 *  - AI grease estimate from photo: reads ai_photo_measurements, returns a
 *    suggested grease_depth_pre_inches. Wire the "AI estimate" button to it.
 *  - Certificate PDF generation: fills csc_certificates.pdf_url / pdf_size_bytes
 *    and uploads to the 'certificates' bucket.
 */
