# Liftori CRM Mobile

A **reusable, tenant-configurable** Expo (SDK 51) phone app for Liftori CRM tenants.
First config: **RoofX** (roofing). Each EAS build targets exactly one tenant
Supabase project via env — no code changes to add another tenant.

Stack: Expo SDK 51 · expo-router · NativeWind · TanStack Query · Supabase.
Android-first (matches BOLO Go). iOS bundle id is set but untested.

## Phase 1 (this build)
- **Auth** — sign in against the tenant Supabase project.
- **Dashboard** — open deals, pipeline value, active jobs, estimates pending, won MTD, recent activity.
- **Sales** — deal pipeline (move stages) + contacts (call / text / email / map).
- **Jobs** — work orders (update status, map, crew) + 3-week schedule.
- **Estimates** — list + detail with line items/totals + **field e-sign sign-off**
  (typed name + consent + timestamp + IP → `esign_status='signed'`).
- **More** — account, company settings (read-only), sign out.

## Phase 2 (built)
- **Team Chat** — channels + threaded messages, send, 5s poll (`chat_*`).
- **Notes** — list, create, pin, delete (`admin_notes`).
- **Tasks** — list, create, complete-toggle, priority, delete (`admin_tasks`).
- **Calendar** — events grouped by date, create (all-day/timed) (`admin_calendar_events`).
- **EOS** — Rocks (progress), Issues (create/solve), To-Dos (complete) (`eos_*`).
- **Settings** — editable company profile (`org_settings`).
- **More** is now a hub menu linking to all of the above.

## Phase 3 (next)
Create/edit flows for deals/contacts/estimates/work-orders, push notifications,
realtime chat (replace poll), **drawn-signature canvas**, work-order photo capture,
offline cache. See `ROADMAP.md`.

## Tenant config (the only knob)
Set in `eas.json` per build profile (and `.env` for local dev). RoofX is wired in:

| Var | RoofX value |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://wjdythxmmpkexbllqrkw.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | RoofX anon key |
| `EXPO_PUBLIC_PLATFORM_ID` | `6be83acc-d777-439c-becf-a41fb77614aa` |
| `EXPO_PUBLIC_APP_NAME` | `RoofX` |
| `EXPO_PUBLIC_ACCENT_COLOR` | `#0EA5E9` |

`lib/config.ts` also hardcodes the RoofX values as **fallbacks** so OTA env-inlining
failures can't brick the app. To stand up another tenant, copy a profile and swap
those five vars.

> Auth + data both live in the tenant project (unlike LiftOp, which auths on MAIN).
> RoofX tenant data is currently **anon-open** (same as the web CRM) — harden RLS to
> `authenticated` before onboarding paying strangers.

## Run / build
```bash
# 1. Move this folder OUT of OneDrive (OneDrive breaks git/tar/installs):
#    move it to  C:\dev\liftori-crm-mobile
cd C:\dev\liftori-crm-mobile

# 2. Install (uses .npmrc legacy-peer-deps)
npm install

# 3a. Local dev (Expo Go / dev client)
cp .env.example .env
npx expo start

# 3b. Web preview (renders all UI in a browser; native-only bits no-op)
npx expo start --web      # or: npx expo export --platform web  -> ./dist

# 4. Android APK (set EAS projectId in app.json -> extra.eas.projectId first)
eas build --platform android --profile preview
```

### Before first EAS build
1. `app.json` → `extra.eas.projectId` is a placeholder — run `eas init` (Expo
   account `rhinomarch`) to create/link the project and fill it in.
2. Confirm the RoofX team has Supabase **auth users** (see below) — the app signs
   in against the tenant project.

## Auth users (RoofX)
`org_team_members` lists the RoofX team but they need matching Supabase
**auth.users** to log in. Create them in the RoofX project (Dashboard → Auth →
Add user, or admin API), then link `org_team_members.user_id`. A starter login is
provisioned for the owner — ask Ryan/Sage for the credentials.

## SDK 51 build notes
- `babel.config.js` mirrors the known-good liftop scaffold (`nativewind/babel`
  preset + reanimated **last**). If you hit
  `Cannot find module 'react-native-worklets/plugin'`, switch to the inline
  css-interop babel form documented in the `liftori-mobile` skill.
- Use `npx expo install <pkg>` for native deps (never `npm install`), and rebuild
  the APK before shipping an OTA that imports a new native module.
