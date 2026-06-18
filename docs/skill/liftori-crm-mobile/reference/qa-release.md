# QA & release gate — Liftori mobile apps

## Static verification (runs in the sandbox)
The sandbox can't finish a full Expo `npm install`, and Metro transpiles without
typechecking — so the meaningful pre-build bar is: **valid config, all imports
resolve, all named imports are exported, every file parses.** Run this from the repo
root after a build wave:

```bash
# JSON config parses
for f in package.json app.json eas.json tsconfig.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "ok $f" || echo "BAD $f"; done

# @/ imports resolve + named exports exist  (python script — see below)
python3 verify_imports.py
```
`verify_imports.py` walks `app/ lib/ components/`, checks every `from "@/..."`
resolves to a file, and that each `{ named }` import is actually exported by the
target. Treat a "NOT EXPORTED" right after an edit as **OneDrive sync lag** first —
`grep` the file; if the symbol is there in the file tool but not the mount, it's lag,
not a miss. The authoritative `tsc`/EAS build runs on Ryan's machine.

## Manual / click-through QA
- Click through **every flow** on the web export (`npx expo export --platform web`
  → serve `dist`, or `npx expo start --web`). Native-only bits (camera) no-op but all
  UI + data renders.
- Verify **cold start signed-out** (lands on login) and **signed-in** (lands on tabs,
  no bounce).
- Each list: loading → data → empty (with a fresh/empty tenant) → error (kill network).
- Each mutation: optimistic feedback, success refetch, error Alert.
- Run the **security checklist** and **design checklist**.

## Demo data
Seed a few rows per surface in the tenant so screens demo non-empty (idempotent
`if not exists` inserts). Keeps demos and screenshots honest.

## EAS / OTA discipline (defer to `liftori-mobile`)
- **Native dep → APK rebuild BEFORE the OTA that imports it.** A package is native if
  it ships `ios/`, `android/`, or `*.podspec`. Re-ship order after a rollback: push
  code (no OTA) → `eas build` → install APK → THEN `eas update`.
- **Silent OTA updater mounts ABOVE the auth gate** so a bad auth bundle can self-heal
  for logged-out users.
- `expo install` (never bare `npm install`) for native deps; `expo install --check`
  before patching. `[skip update]` in a commit message skips OTA.
- `appVersionSource: "local"`; bump versions in `app.json`. `eas init` to set
  `extra.eas.projectId` before the first build.
- Vercel/web preview embedding is **same-site only** — a `*.vercel.app` embedded in
  `admin.liftori.ai` is cross-site → storage partitioning bricks the RN app. Give the
  preview a subdomain of the host's registrable domain (e.g. `roofx-app.liftori.ai`).

## Telemetry & observability
- Wire prod errors to the work queue (`[AUTO]` rows) like the web app; `sendBeacon`
  payloads are `text/plain` only.
- Measure cold-start, sign-in success, key flow completion (estimate signed, job
  status changed) — **never** log tokens or PII.

## Release sign-off
Static verify clean · both gates passed · click-through done · demo data seeded ·
EAS profile + projectId set · brief + ROADMAP + memory updated.
