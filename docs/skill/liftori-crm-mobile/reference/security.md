# Security gate — Liftori mobile apps

The app ships a public anon key in a readable bundle. **Assume an attacker has the
key and the source.** Therefore the database (RLS) is the only real security
boundary, and nothing secret may live in the app. Work this checklist on every build
and before any tenant goes to a real customer. Any unchecked P0 = do not ship.

## P0 — must hold before a real customer
- [ ] **RLS enabled on every tenant table** that the app reads/writes. No table the
      app touches may be RLS-off.
- [ ] **Tenant data scoped to `authenticated`** (minimum), ideally to the user's org
      / ownership. RoofX and the CRM tenants are **anon-open today** (matches the web
      CRM, deferred). That is acceptable for internal demos, NOT for paying strangers.
      Harden before onboarding external customers.
- [ ] **No `service_role` key, no API secret, no private token** anywhere in the app,
      `app.json`, `eas.json`, or `EXPO_PUBLIC_*`. The bundle and env are readable.
      Secrets live only in Supabase edge-function secrets / EAS secrets.
- [ ] **Auth session stored in SecureStore** (Keychain/Keystore-backed), never
      AsyncStorage (plaintext). `persistSession` + `autoRefreshToken` on the tenant
      client only.
- [ ] **Sign-out clears everything:** `supabase.auth.signOut()` + clear react-query
      cache so a tenant's data can't linger for the next user on a shared device.
- [ ] **Private storage buckets** for customer photos and signatures; serve via
      short-lived signed URLs. Never public buckets for customer PII.

## P1 — strong defaults
- [ ] **Add a scoped SELECT whenever you add UPDATE/DELETE.** A row-restricted UPDATE
      with no matching SELECT silently affects 0 rows (memory
      `feedback_rls_update_needs_select_policy`). Author SELECT + UPDATE together.
- [ ] **Grep public/anon write paths before locking down** a table (memory
      `feedback_grep_anon_writes_before_lockdown`) — column-scoped grants +
      in-flight-row policies for legit anon flows (e.g. customer-facing estimate sign).
- [ ] **Edge functions:** keep `verify_jwt=true`; attach the bearer token explicitly
      (`functions.invoke` drops the Authorization header on a refreshing session →
      opaque 401). Cross-project calls must be AbortController-timeout-wrapped
      (`liftori-mobile`).
- [ ] **Run Supabase advisors after every schema change** and reclassify by blast
      radius, not the label: anon/secret exposure = P0 regardless of WARN
      (memory `feedback_advisor_severity_reclassify`).
- [ ] **Least privilege:** the app should only be able to read/write what the signed-in
      role needs. Plan role-aware policies (Owner / Office / Dispatcher / Field /
      Sales) as the app gains create/edit power.
- [ ] **Input validation:** validate and bound user input before writes; guard the
      Android IME per-keystroke ghost-typing (`liftori-mobile`). supabase-js
      parameterizes — never build raw SQL from user input.

## P1 — e-sign integrity (legal weight)
- [ ] Capture **signer name + explicit affirmative consent + server-side timestamp.**
- [ ] **Server-side IP/device capture** for attribution — client IP (ipify) is
      spoofable; for a legally robust signature, record it in an edge function, not
      the client. (Current build uses client IP — flagged for upgrade.)
- [ ] **Immutability:** a signed estimate must not be silently re-signed or edited.
      Lock the record (status/`esign_status`) and, ideally, snapshot+hash the signed
      content so the signed version is provable.
- [ ] Align to **ESIGN/UETA**: intent to sign, attribution, association of signature
      to the record, and a retained audit trail.

## P2 — hardening & hygiene
- [ ] **Deep links / scheme:** never trust deep-link params for auth or to mutate
      without re-checking the session; validate ids.
- [ ] **Telemetry never captures tokens or PII;** scrub before send (`sendBeacon`
      payloads are `text/plain`, memory `project_telemetry_and_nightly_build`).
- [ ] **Dependency hygiene:** `expo install` (pinned) for native deps; review
      `npm audit`; no unpinned `npm install` (breaks Kotlin/gradle on the SDK).
- [ ] **Keys fetched fresh via MCP**, never copied from chat context; decode + verify
      iat/exp before commit (memory `feedback_credential_source_of_truth`).
- [ ] **No PII in logs / crash reports;** redact customer name/address/phone.
- [ ] Consider screenshot/recording protection on the signature screen (FLAG_SECURE)
      for high-trust deployments.

## The RLS hardening pattern (anon-open → authenticated)
For each tenant table the app uses:
```sql
alter table public.<t> enable row level security;

-- minimum: any signed-in tenant user
create policy "<t>_auth_select" on public.<t>
  for select to authenticated using (true);
create policy "<t>_auth_write" on public.<t>
  for all to authenticated using (true) with check (true);

-- better: scope to org/owner (once org_id/owner_user_id exists on the row)
-- using (org_id = (select org_id from org_team_members where user_id = auth.uid()))
```
Then revoke the broad anon policies, **after** grepping for legit anon flows
(customer-facing estimate/booking pages) and replacing them with narrow,
column-scoped, in-flight-row policies. Re-run advisors; confirm the app still works
signed-in. Track the migration in `WORK_LOG.md`.

## Sign-off
A build passes the security gate when every P0 is checked, P1s are checked or have a
written exception, and Supabase advisors show no anon/secret P0 for the tables the
app touches.
