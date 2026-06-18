# Design & field-UX gate — Liftori mobile apps

These apps are used on a roof, in a truck, in the sun, with one hand, sometimes with
gloves. Design for that reality first, polish second. A screen that fails the field
test fails the gate.

## Design tokens (single source of truth)
- Colors live in `tailwind.config.js` (`colors.crm.*`) mirrored in `lib/theme.ts` for
  native styles. Never hardcode hex outside theme — use `theme.colors.*`.
- Dark theme by default: bg `#0b0f17`, surface `#141a24`, elevated `#1c2533`, border
  `#2a3645`, text `#f2f6fb`, muted `#93a1b5`. Accent is **per-tenant** from
  `org_settings.accent_color` via `useAccent()` (default `#0EA5E9`).
- Spacing scale `theme.spacing` (4/8/16/24/32), radii `theme.radius`, type
  `theme.fontSize`. Use them — no off-scale magic numbers.

## Field-use rules (the hard requirements)
- **Touch targets ≥ 44pt.** Buttons full-width by default; icon-only controls get
  generous `hitSlop`.
- **Reachability:** primary navigation is bottom tabs; primary actions sit low; FABs
  anchor at `useSafeAreaInsets().bottom + 80` (never hardcoded `bottom: 24` — hides
  under the tab bar). Avoid top-of-screen-only actions.
- **Minimize typing:** defaults pre-filled (today's date, sensible status), pickers
  and `Segmented` over free text, `keyboardType` matched to the field, numeric pads
  for numbers.
- **Sunlight legibility:** high contrast, large weights for key numbers
  (`StatTile` uses 2xl/800), avoid thin muted text for critical data.
- **Confirm destructive actions** (delete, sign, status→completed) with an Alert.
- **Pull-to-refresh** on every list; show fetching state.
- **Forgiving inputs:** trim, validate, and surface inline errors via `Input.error`.

## Every screen, every time
- Render all three states: **Loading** (`LoadingView`), **Empty** (`EmptyState`
  with icon + helpful subtitle), **Error** (`ErrorView` with the message). No silent
  blank screens.
- Use the shared kit — `ScreenContainer`, `Card`, `Button`, `Input`, `Badge`,
  `Segmented`, `StatTile`, `Avatar`, `Sheet`. No bespoke one-off components unless the
  pattern is genuinely new (then add it to the kit).
- Status/stage shown as a `Badge` with `toneForStatus()` — color AND text, never
  color alone.
- Headers: list screens get a screen title; detail screens use the native stack
  header (set `title` per route, dynamic via `<Stack.Screen options>` where needed).

## Accessibility (WCAG AA baseline)
- Every icon-only control has an accessible label.
- Color is never the only signal (badges, icons carry text/shape too).
- Accent-on-dark must meet AA contrast; verify when a tenant sets a custom accent —
  if it fails, fall back to the default accent for text/icons.
- Respect dynamic type; don't clamp font scaling off. Test with large text.
- Logical focus order; meaningful `accessibilityRole`.

## Branding per tenant
- Name, accent, logo come from `org_settings` at runtime (`OrgProvider`). The login
  screen and headers reflect the tenant automatically.
- App icon / splash / adaptive icon are per-build assets (Phase 5: generate from
  `org_settings` branding). Keep splash bg = theme bg to avoid a flash.
- Customer-facing apps may need a lighter theme variant — branch the theme by
  `tenantConfig` / audience, don't fork the components.

## Motion & feedback
- Restrained motion (Stack `animation: "fade"`); press-fade via `pressed` state.
- Optimistic, immediate feedback on taps; never leave an action looking dead while a
  mutation runs (`Button.loading`).

## Design sign-off
A build passes when: all three states render on every list, touch targets and
reachability meet the field rules, status uses text+color, tenant branding resolves,
and a custom tenant accent still meets contrast (or falls back).
