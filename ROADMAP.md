# Liftori CRM Mobile — Build Roadmap

How we build CRM mobile apps on the reusable shell, and what ships in each wave.
This is the **CRM phone app** track (RoofX is config #1). For Expo/SDK-51 mechanics
(OTA vs EAS, babel, native deps) see the `liftori-mobile` skill.

---

## The model: one shell, many tenants

ONE Expo codebase. Each tenant is a **build-time config** (5 env vars in `eas.json`),
auth + data both against that tenant's own Supabase project. The shell mirrors the
web CRM's data model so numbers match across web + phone.

```
liftori-crm-mobile  ──(EXPO_PUBLIC_* per profile)──►  RoofX     (wjdythxmmpkexbllqrkw)
                                                  ►  Apex HVAC (mgzogsebufwfcwokzxql)
                                                  ►  CSC       (spgainjpxualjtbatfmk)
                                                  ►  …any tenant on the CRM template
```

## Stand up a NEW tenant app (repeatable checklist)
1. Add an `eas.json` build profile (or swap `.env`) with the tenant's
   `EXPO_PUBLIC_SUPABASE_URL`, `_ANON_KEY` (legacy anon JWT — fetch fresh via MCP,
   verify iat/exp), `_PLATFORM_ID`, `_APP_NAME`, `_ACCENT_COLOR`.
2. Confirm the tenant has the standard CRM schema (it will, if provisioned from
   the tenant template). Branding auto-loads from `org_settings`.
3. Provision at least one **auth user** in the tenant project (empty-string token
   recipe + `auth.identities` row) and link `org_team_members.user_id`.
4. `eas build -p android --profile <tenant>`. Done — no code changes.

---

## Wave plan

### ✅ Phase 1 — Field core (DONE)
Auth · Dashboard · Sales (pipeline + contacts) · Jobs (work orders + schedule) ·
Estimates list/detail + **typed e-sign sign-off**.

### ✅ Phase 2 — Full hub parity (DONE)
Team Chat · Notes · Tasks · Calendar · EOS (rocks/issues/todos) · editable Settings ·
More-as-hub-menu.

### ✅ Phase 3 — Create / edit everywhere (DONE 2026-06-18)
- New + edit: contacts, deals, estimates (line-item builder w/ template seed), work orders.
- Convert deal → work order (prefills contact + property address).
- **Drawn-signature** on estimate sign — built on `react-native-svg` + PanResponder
  (NO webview dep; renders in the web preview). Uploads PNG to the private
  `signatures` bucket; added `customer_estimates.signature_url`. Typed sign-off
  still stands if the drawing is skipped.
- Work-order **photo capture** (`expo-image-picker`) → before/after, uploaded to the
  private `job-photos` bucket with signed-URL display.
- Storage: 2 private buckets created on the RoofX tenant with RLS policies.
- Native signature/photo UI is exercised on the EAS APK build; web preview loads
  everything (capture-to-PNG may no-op on web).

### ⏳ Phase 4 — Realtime + reliability (realtime DONE 2026-06-18)
- ✅ **Realtime chat** (Supabase `postgres_changes`) + **live dashboard/lists**; poll
  kept as a 20s fallback. `lib/realtime.ts` `useRealtime(table, keys, filter)`.
  Publication enabled on RoofX for chat_messages / customer_pipeline /
  ops_work_orders / customer_estimates / admin_tasks / admin_notes.
- ⏳ Push notifications (`expo-notifications`) — native dep; needs device tokens + a
  server sender. Deferred (untestable in sandbox).
- ⏳ Offline read cache (react-query persist + AsyncStorage) — native dep. Deferred.
- ⏳ Silent OTA updater mounted ABOVE the auth gate (per `liftori-mobile`).

### ⏳ Phase 5 — Productionize the shell
- In-admin **web preview** (Expo web export on a same-site subdomain, e.g.
  `roofx-app.liftori.ai`) wired into the Liftori App Viewer.
- RLS hardening: scope tenant data to `authenticated` (today it's anon-open).
- Role-aware UI (Owner / Office / Dispatcher / Field tech / Sales).
- Per-tenant icon/splash from `org_settings` branding; EAS profile generator.

---

## Build conventions (so every wave stays consistent)
- **Services mirror the web CRM `.from()` queries**; verify schema via MCP before coding.
- **Joins in JS** (fetch + map by id), not PostgREST embedding — no FK-name guessing.
- **Defensive enums**: compute from raw rows; never assume stage/status values.
- **One client** (`lib/supabase.ts`) for auth + data; tenant from `lib/config.ts`
  with hardcoded fallbacks vs OTA env-inlining failures.
- **Create flows** use the `Sheet` modal; **lists** use `Card` + `StateViews`.
- End every session: static check (imports/exports/JSON), seed demo rows so screens
  demo non-empty, write lessons back to the skill + memory.
