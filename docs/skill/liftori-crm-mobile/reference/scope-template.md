# App Scope Spec — intake template

This is the single contract between a scope (from the dev-team work queue) and a
build. Fill one per app (or per wave). The builder parses it top-to-bottom; anything
omitted is assumed out of scope. Keep it in the repo as `SCOPE.md`.

---

## 1. App identity
- **App name / tenant:** (e.g. RoofX)
- **Industry / vertical:** (roofing, HVAC, ecommerce, customer-facing, …)
- **Audience:** internal staff app  |  customer-facing app  |  both
- **Auth model:** tenant-direct (default CRM)  |  MAIN + tenant-federated (roaming login, e.g. BOLO Go)
- **Backend:** tenant Supabase project id + URL
- **Branding:** accent color, logo source (org_settings / asset), app icon/splash
- **Platforms:** Android (default)  |  iOS  |  web preview
- **Roles to support:** (Owner, Office, Dispatcher, Field, Sales, Customer…) and what each can see/do

## 2. Surfaces (tabs + hubs)
List the surfaces and where each lives. Mark MVP vs later.
| Surface | Placement | MVP? | Notes |
|---|---|---|---|
| Dashboard | tab | ✅ | KPIs: … |
| Sales | tab | ✅ | pipeline + contacts |
| … | tab/hub-menu | | |

## 3. Per-surface detail (repeat this block per surface)
**Surface:** <name>
- **Primary table(s):** (verify columns via MCP before building)
- **List view:** which fields show per row; sort; filters/segments; search?
- **Detail view:** fields, related records, linked navigation
- **Actions / mutations:** (e.g. move stage, update status, mark sent, call/text/map)
- **Create / edit:** in scope? which fields; required vs optional; validation rules
- **Special flow:** e-sign | photo capture | QR scan | payment | map | signature | none
- **Role visibility:** who sees this surface / which actions are gated
- **Empty/loading/error copy:** any custom messaging

## 4. Special flows (only if used)
- **E-sign:** typed sign-off (default) or drawn canvas (native dep → APK rebuild); what gets signed; where stored; legal requirements
- **Photos:** capture source (camera/library); before/after; storage bucket (private); compression
- **Scan/QR:** what it scans; what it creates; offline behavior
- **Payments:** processor; what triggers; PCI scope (keep card data out of the app)
- **Maps:** provider = MapLibre + CARTO (never Mapbox — locked); what's plotted
- **Notifications:** which events push; deep-link target

## 5. Integrations
External services (Resend, Stripe, Twilio, Meta, Places, etc.), which edge functions,
which secrets (server-side only), and what the app calls vs. what runs server-side.

## 6. Non-functional requirements
- **Offline:** read-cache? optimistic writes? queue-and-sync?
- **Realtime:** which surfaces need live updates (chat) vs poll vs on-demand
- **Performance budgets:** list size, image sizes, cold-start target
- **Accessibility:** dynamic type, screen-reader, contrast (always WCAG AA)
- **Telemetry:** what to measure (no PII/tokens)

## 7. Security scope (cross-check reference/security.md)
- **Data sensitivity / PII** present (customer name/address/phone, payments, signatures)
- **RLS target:** anon-open (demo only) → `authenticated` → org/owner-scoped → role-scoped
- **Who can write what** (informs policies)
- **Anything that stays anon** (customer-facing sign/booking pages) and why

## 8. Out of scope (explicit)
List what this build will NOT include so it isn't half-built.

## 9. Definition of Done
- [ ] Every in-scope surface: data layer + screen + states + (create/edit if scoped)
- [ ] Security gate passed (reference/security.md) at the required RLS tier
- [ ] Design gate passed (reference/design.md)
- [ ] Static verify clean; demo data seeded; cold-start signed-out & signed-in OK
- [ ] Brief delivered; ROADMAP + memory updated

---

### Example (filled, abridged) — RoofX Sales surface
- **Surface:** Sales · **Tables:** customer_contacts, customer_pipeline, pipeline_stage_definitions
- **List:** pipeline grouped by stage (title, contact, value, stage badge); contacts list (name, city, type)
- **Detail:** deal → value, stage, contact, probability, close date, notes; stage-move buttons
- **Actions:** move stage; call/text/email/map contact
- **Create/edit:** deferred to Phase 3
- **Special flow:** none here (e-sign lives on Estimates)
- **Roles:** all internal roles see Sales; Field tech read-only (future)
- **RLS target:** authenticated + org scope (currently anon-open, demo tier)
