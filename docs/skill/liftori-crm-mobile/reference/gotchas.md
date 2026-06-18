# Gotchas & cross-project lessons (running log)

Append every hard-won lesson here so the next app inherits it. Date entries.

## Build environment
- **OneDrive sync lag.** The bash mount lags the Edit/Write file tool. A `grep`
  "not found" / "NOT EXPORTED" immediately after an edit is usually stale, not a real
  miss — trust the file tool, re-check the mount a moment later. (2026-06-17)
- **Sandbox npm is too slow** to finish a full Expo install in one call → rely on
  static verification (imports/exports/JSON). Metro transpiles, no typecheck, so that
  is the real bundling bar; authoritative build is on Ryan's machine. (2026-06-17)
- **Author in OneDrive, build in C:\dev.** OneDrive breaks git/tar/npm. Move the repo
  to `C:\dev\<app>` before install/build (memory `feedback_dev_repos_outside_onedrive`).
- **Dotfiles** (`.npmrc`, `.env.example`) are blocked by the Write tool — create via
  bash on the mount.

## Supabase from mobile
- **Legacy anon JWT** (not `sb_publishable_…`) for supabase-js 2.45; fetch fresh via
  MCP, verify iat/exp. (2026-06-17)
- **`org_settings` is a uuid singleton** (one row) → `.limit(1).maybeSingle()`, not
  `.eq('id',1)` (that's the ecommerce tenant pattern). (2026-06-17)
- **Tenant auth users don't exist by default** — provision with the empty-string
  token recipe + `auth.identities` row, link `org_team_members.user_id` (memory
  `feedback_manual_auth_user_null_tokens`).
- **`functions.invoke` drops the Authorization header** on a refreshing session →
  opaque 401; attach the bearer token explicitly.
- **Joins in JS, not PostgREST embedding** — FK-relationship names drift between
  tenants; fetch + map by id.

## Expo / SDK 51 (see `liftori-mobile` for the full set)
- babel mirrors the known-good liftop scaffold (`nativewind/babel` + reanimated
  LAST). If `Cannot find module 'react-native-worklets/plugin'`, switch to the inline
  css-interop babel form.
- Native deps need an APK rebuild before the OTA that imports them.
- FAB bottom inset, controlled-TextInput IME ghost-typing guard, `unstable_settings
  initialRouteName` per nested stack — all in `liftori-mobile`.

## E-sign
- Client IP (ipify) is spoofable — move IP/device capture server-side (edge function)
  for legal weight. Typed sign-off is fine for v1; drawn canvas is a native dep
  (rebuild-before-OTA) and needs a `signature_url` column/bucket. (2026-06-17)

## BOLO Go / live-session lessons (fold in here)
> The BOLO Go and other in-flight sessions have deep learnings — scanner UX, OTA
> recovery from a bad auth bundle, AsyncStorage-shipped-via-OTA hang, credits/metering
> timeouts, web-preview storage partitioning, NativeWind invisible-Pressable. As those
> sessions wrap, paste the distilled lesson here (one line each, dated) so every future
> Liftori app starts from the raised floor.
- _(add BOLO Go lessons…)_
