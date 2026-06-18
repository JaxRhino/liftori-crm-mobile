---
name: liftori-crm-mobile
description: >-
  Liftori's master playbook for building tenant CRM and customer phone apps on ONE
  reusable Expo shell. Feed it an app SCOPE and it produces a secure, well-designed,
  consistent app: sales, operations, jobs, estimates+sign, chat, notes, tasks,
  calendar, EOS, settings, or any customer-app surface, against a tenant Supabase.
  Use when building or extending ANY Liftori phone app (RoofX, Apex HVAC, CSC,
  BOLO Go, future customer apps). Triggers on: build the app, scope to app, CRM
  mobile, tenant app, customer app, RoofX/BOLO app, estimate sign, work orders
  mobile, add a screen/hub to the app. Security and design are NON-NEGOTIABLE
  gates — see reference/security.md and reference/design.md. Pair with
  `liftori-mobile` (Expo SDK-51 mechanics: OTA/EAS, babel, native deps) and
  `liftori-supabase` (tenant schema). Repos live under C:\dev (authored in
  OneDrive Liftori In-House Builds first, then moved).
---

# Liftori Mobile App Builder — master playbook

Turn an app **scope** into a shipped phone app on the reusable Liftori shell.
One Expo codebase, configured per tenant at build time. RoofX (roofing CRM) is
config #1; the same shell powers Apex HVAC, CSC, BOLO Go, and future customer apps.

**This skill owns:** scope→app pipeline, architecture, security gate, design system,
data patterns, QA & release. **It defers to:** `liftori-mobile` for Expo/SDK-51
mechanics (OTA vs EAS, babel fixes, native-dep ordering, in-admin web preview) and
`liftori-supabase` for tenant DB schema/RLS authoring.

> Two things are GATES, not suggestions — an app does not ship if either fails:
> **Security** (reference/security.md) and **Design/field-UX** (reference/design.md).

---

## 0. The operating loop (every build, every wave)
1. **Take the scope.** Parse it into the Scope Spec (reference/scope-template.md).
   If a scope is vague, fill gaps from the matching web CRM hub + ask Ryan only the
   decisions that change architecture.
2. **Verify schema via MCP** before writing a query — `list_tables` /
   `information_schema`. Never assume columns or enum values.
3. **Build in layers:** services → hooks → screens → routing. Mirror existing
   patterns exactly (see §3).
4. **Run the gates:** security checklist + design checklist + static verify (§6).
5. **Seed demo rows** per surface so screens demo non-empty.
6. **Deliver + log:** brief, update `ROADMAP.md`, append lessons here and to memory
   `project_roofx_crm_mobile`. End-of-session is also when BOLO Go / other live
   sessions fold their learnings into reference/gotchas.md.

Definition of Done for a feature: data layer + screen + create/edit (if in scope) +
loading/empty/error states + security policies in place + demo data + it survives a
cold start signed-out and signed-in.

---

## 1. Architecture — the reusable shell
- **One client, tenant-targeted.** Each CRM tenant has its OWN Supabase (auth.users
  + CRM tables). A single `lib/supabase.ts` points at the tenant (`lib/config.ts`
  from `EXPO_PUBLIC_*`) and handles BOTH auth and data. (Contrast LiftOp/BOLO Go,
  which auth on MAIN and federate tenant data via `getDataClient()` — use that model
  ONLY when one login must roam across tenants. See `liftori-mobile`.)
- **Tenant = 5 env vars** in `eas.json` per profile: `EXPO_PUBLIC_SUPABASE_URL`,
  `_ANON_KEY`, `_PLATFORM_ID`, `_APP_NAME`, `_ACCENT_COLOR`. `lib/config.ts`
  hardcodes them as fallbacks (OTA env-inlining fails silently → `fetch('undefined/…')`).
  **Only public values go in `EXPO_PUBLIC_*` — the bundle is readable.** Secrets live
  in edge functions (see security).
- **Providers** (`app/_layout.tsx`): GestureHandlerRootView → QueryProvider →
  AuthProvider → OrgProvider → Stack. Auth stays `isLoading` until `getSession()`
  resolves (no cold-start bounce). Branding from `org_settings` via
  `OrgProvider`/`useAccent()`.
- **Routing:** 5 tabs (Home/Sales/Jobs/Estimates/More); everything else is a
  top-level Stack route reached from **More-as-hub-menu**; detail routes are
  `<entity>/[id]`. Register every route in `app/_layout.tsx`.
- **Stack:** Expo SDK 51 · expo-router · NativeWind · TanStack Query · Supabase.
  Mirror the known-good liftop scaffold (babel `nativewind/babel` + reanimated LAST;
  `.npmrc` legacy-peer-deps; SecureStore session storage).

## 2. Scope-driven build → see reference/scope-template.md
The dev-team work queue feeds a **Scope Spec**. Parse it into: app identity (tenant,
industry, name, brand, audience: internal vs customer), the surfaces/hubs to build,
and per surface — data table(s), list fields, detail fields, actions/mutations,
create/edit forms, role visibility, and special flows (e-sign, photo capture, QR
scan, payments, maps). Anything not in scope is explicitly out. The template is also
the dev-team intake form — keep it the single contract between scope and build.

## 3. Data & UI patterns (mirror exactly)
- **Services mirror the web CRM `.from()` queries** so web + phone numbers match.
- **Joins in JS** — fetch rows + fetch related (contacts/crews) + map by id. Do NOT
  rely on PostgREST embedding (FK-relationship names drift).
- **Defensive enums** — compute open/won/active from raw rows; never hardcode
  stage/status sets a tenant may have customized.
- **Hooks** = react-query; mutations `invalidateQueries` for the touched list +
  `["dashboard"]`. Chat polls (`refetchInterval`) until realtime ships.
- **UI kit** (reuse, don't reinvent): `ScreenContainer` (+RefreshControl), `Card`
  (onPress), `Button`, `Input`, `Badge`+`toneForStatus`, `Segmented`, `StatTile`,
  `Avatar`, `StateViews` (Loading/Empty/Error), `Sheet` (bottom-modal create forms).
  Every list MUST render loading, empty, and error states.

## 4. Security gate (NON-NEGOTIABLE) → reference/security.md
Top rules, in priority order — the full checklist is the gate:
1. **RLS is the only real boundary.** The anon/publishable key is public; assume an
   attacker has it. Every tenant table must have RLS scoping rows to the
   authenticated user/org. **Tenant data is anon-open today — that is a launch
   blocker; harden to `authenticated` (+ owner/org scope) before any real customer.**
2. **No secrets in the app.** `EXPO_PUBLIC_*` and the bundle are readable. NEVER ship
   `service_role` or any API secret in the app — secrets live in edge functions.
3. **Auth session in SecureStore** (encrypted), never AsyncStorage. Clear session +
   query cache on sign-out. Never log tokens/PII.
4. **When adding UPDATE/DELETE, add the scoped SELECT too** (anon/rls UPDATE…WHERE
   silently hits 0 rows without SELECT). Grep public-page writes before locking down.
5. **e-sign integrity:** capture name + explicit consent + server timestamp; treat a
   signed estimate as immutable (no silent re-sign); store signatures/photos in
   PRIVATE buckets via signed URLs. Client IP is spoofable — capture server-side in
   an edge function for legal weight (ESIGN/UETA: intent + attribution + audit trail).
6. **Run Supabase advisors** after schema changes and reclassify: any anon/secret
   exposure = P0.

## 5. Design & field-UX gate → reference/design.md
- **Built for the field:** ≥44pt touch targets, high contrast for sunlight, one-handed
  reach (bottom tabs, bottom-anchored primary actions), minimal typing (defaults,
  pickers, segmented controls), confirm destructive actions, pull-to-refresh.
- **Brand per tenant** from `org_settings` (accent/logo/name); dark theme default;
  accent must meet WCAG AA contrast on dark.
- **Accessibility:** text labels on every icon-only control, color never the sole
  signal (badges carry text), respect dynamic type, screen-reader labels.
- **Consistency:** same components, spacing scale (theme.spacing), and state patterns
  on every screen. No bespoke one-off styling.

## 6. QA & release gate → reference/qa-release.md
- **Static verify** (sandbox can't finish a full Expo install): JSON parses, all
  `@/` imports resolve, all named imports are exported. Metro transpiles (no
  typecheck) so that's the real bundling bar; authoritative `tsc`/build runs on
  Ryan's machine.
- **Click-through** every flow on the web export; security checklist; design checklist.
- **EAS/OTA discipline** (`liftori-mobile`): native dep → APK rebuild BEFORE the OTA
  that imports it; silent updater mounts ABOVE the auth gate; `expo install` for
  native deps; `[skip update]` to skip OTA.

## 7. Per-tenant provisioning & new-app checklist
1. Add an `eas.json` profile with the tenant's 5 env vars (anon key = **legacy JWT**,
   fetched fresh via MCP, iat/exp verified — supabase-js 2.45 prefers it over
   `sb_publishable_…`).
2. Confirm tenant has the standard CRM schema (provisioned from template). Branding
   auto-loads from `org_settings`.
3. Provision auth users in the tenant (**empty-string token recipe** + `auth.identities`
   row) and link `org_team_members.user_id` (memory `feedback_manual_auth_user_null_tokens`).
4. Harden RLS (security gate) BEFORE handing to a real customer.
5. `eas init` → fill `app.json` extra.eas.projectId → `eas build -p android --profile <tenant>`.

## 8. Gotchas & cross-project lessons → reference/gotchas.md
Running log. Already captured: OneDrive sync lag (mount lags Edit/Write — trust the
file tool), sandbox npm too slow (verify statically), legacy anon key for 2.45,
`org_settings` is a uuid singleton (`.limit(1).maybeSingle()`). **BOLO Go / live
sessions: append your hard-won lessons here** (scanner, OTA recovery, credits
metering, web-preview storage partitioning) so every future app inherits them.

## Roadmap
reference/ROADMAP pointer / repo `ROADMAP.md`: P1 field core ✅ · P2 hub parity ✅ ·
P3 create/edit + drawn-sign + photos · P4 realtime + push + offline · P5 in-admin
web preview + RLS hardening + role-aware UI. Customer-app scopes plug into the same
loop once the work queue feeds them.
