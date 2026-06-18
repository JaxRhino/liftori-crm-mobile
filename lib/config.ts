/**
 * Tenant configuration — the ONE knob that makes this a reusable CRM shell.
 *
 * Every EAS build (and local `.env`) targets exactly one Liftori CRM tenant
 * Supabase project. RoofX (roofing) is the first config. To stand up another
 * tenant (Apex HVAC, CSC, …) you only change these env vars in eas.json — no
 * code changes.
 *
 * FALLBACKS: env inlining can silently fail inside OTA bundles (symptom:
 * `fetch('undefined/auth/v1/token')`). So we hardcode the RoofX fallback the
 * same way liftop hardcodes its main fallback. Anon/publishable keys are
 * public-by-design; tenant RLS is the real guard.
 */

const FALLBACK = {
  supabaseUrl: "https://wjdythxmmpkexbllqrkw.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZHl0aHhtbXBrZXhibGxxcmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTA4NTIsImV4cCI6MjA5NjUyNjg1Mn0.oYzN3cAmmi4UynMLKXVwRz0498HLs4fCnGjKXfT5hLU",
  platformId: "6be83acc-d777-439c-becf-a41fb77614aa",
  appName: "RoofX",
  accentColor: "#0EA5E9",
};

export const tenantConfig = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK.supabaseUrl,
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK.supabaseAnonKey,
  platformId: process.env.EXPO_PUBLIC_PLATFORM_ID || FALLBACK.platformId,
  appName: process.env.EXPO_PUBLIC_APP_NAME || FALLBACK.appName,
  accentColor: process.env.EXPO_PUBLIC_ACCENT_COLOR || FALLBACK.accentColor,
};

export type TenantConfig = typeof tenantConfig;

/**
 * CSC (kitchen-exhaust-cleaning, industry 'kec') tenant platform id.
 * All CSC-specific behavior is ADDITIVE and gated on
 * `tenantConfig.platformId === CSC_PLATFORM_ID` so the RoofX (and any other
 * tenant) code path is never touched. Never branch off appName/accentColor —
 * the platform id is the single source of truth for which tenant this build is.
 */
export const CSC_PLATFORM_ID = "88888888-0002-0000-0000-000000000001";

/** True when this build targets the CSC kitchen-exhaust-cleaning tenant. */
export const isCsc = (): boolean => tenantConfig.platformId === CSC_PLATFORM_ID;
