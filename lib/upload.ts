/**
 * Storage upload helpers. Images come from the signature pad (PNG base64) and
 * the photo picker (base64). We decode base64 → ArrayBuffer (no atob dependency,
 * Hermes-safe) and upload to PRIVATE buckets, returning a short-lived signed URL
 * for display. Private buckets + signed URLs per the security gate.
 */
import { supabase } from "@/lib/supabase";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decode a base64 string (no data: prefix) to an ArrayBuffer without atob. */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const clean = b64.replace(/^data:[^,]+,/, "").replace(/[^A-Za-z0-9+/=]/g, "");
  const len = Math.floor((clean.length * 3) / 4) - (clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = B64.indexOf(clean[i]);
    const e2 = B64.indexOf(clean[i + 1]);
    const e3 = B64.indexOf(clean[i + 2]);
    const e4 = B64.indexOf(clean[i + 3]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    if (p < len) bytes[p++] = c1;
    if (e3 !== -1 && p < len) bytes[p++] = c2;
    if (e4 !== -1 && p < len) bytes[p++] = c3;
  }
  return bytes.buffer;
}

/**
 * Upload a base64 image to a private bucket and return a signed URL (1 year).
 * `path` should be unique, e.g. `estimates/<id>/<ts>.png`.
 */
export async function uploadImage(
  bucket: "signatures" | "job-photos",
  path: string,
  base64: string,
  contentType = "image/png"
): Promise<{ path: string; signedUrl: string | null }> {
  const body = base64ToArrayBuffer(base64);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType, upsert: true });
  if (error) throw error;
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  return { path, signedUrl: data?.signedUrl ?? null };
}
