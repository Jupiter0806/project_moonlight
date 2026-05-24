# RFC 2026-05-24: Moonlight History View Coordination and Date Picker

## Metadata

- Status: Proposed
- Authors: Moonlight team
- Created: 2026-05-24
- Target branch: dev (against origin/main)
- Related RFCs:
  - 2026-05-24 Historical Moonlight Access and On-Demand Backfill
- Related areas:
  - `src/features/moonlight/*`
  - `src/widgets/moonlight.tsx`
  - `src/features/app-header/components/moonlight-more-options.tsx`

## Summary

This RFC defines the UI and state-coordination approach for historical Moonlight access:

1. History date picker remains a simple calendar drawer for selection only.
2. Selected historical Moonlight is rendered on the main Moonlight page, not in the drawer.
3. Today and historical modes share the same presentation components.
4. Today and historical data-loading logic are separated into dedicated hooks, coordinated by a parent hook.

## Problem

Without explicit coordination boundaries, the history drawer and main page can drift into duplicated responsibilities:

1. Drawer becoming both selector and content renderer.
2. Main page and drawer fetching overlapping moonlight payloads.
3. Inconsistent empty-state semantics between today and history.

This increases complexity and makes future generation behavior harder to implement safely.

## Goals

1. Keep drawer interaction simple: select date and close.
2. Make main page the single render surface for moonlight content.
3. Reuse `MoonlightDisplayWidget` and `MoonlightEntryWidget` across modes.
4. Separate today/historical fetch logic into dedicated hooks.
5. Preserve current today encouragement behavior.
6. Support history-specific empty-state behavior: no reflections, unable to generate.

## Non-Goals

1. Final historical generation flow implementation.
2. Route-level split between today and history pages.
3. Visual redesign of the Moonlight widget.

## User Stories

1. As a user, I open History, select a date, and return to Moonlight page context immediately.
2. As a user, I see selected historical moonlight in the same place where today moonlight appears.
3. As a user, if no historical moonlight is available and no reflections exist, I see a clear cannot-generate message.
4. As a user, today mode still behaves as before and encourages me to continue learning before nightly generation.

## Decision Record

### D1. Drawer is date-only

- Decision:
  - History drawer only loads highlighted availability and emits selected date.
  - It does not render selected moonlight content.
- Why:
  - Reduces UI coupling.
  - Prevents duplicate rendering paths.

### D2. Main page is the single moonlight content surface

- Decision:
  - Main Moonlight page chooses whether to render today or historical moonlight.
- Why:
  - Keeps one content surface and one visual contract.
  - Simplifies future add-ons (go-back-to-today, generation controls).

### D3. Shared selection state via atom

- Decision:
  - Use `selectedMoonlightHistoryDateAtom` as a cross-component state bridge.
- Why:
  - Header drawer and page widget are sibling surfaces.
  - Avoids prop drilling and route coupling.

### D4. Separate hooks by concern

- Decision:
  - `useTodayMoonlight`: today loading/generation behavior.
  - `useHistoricalMoonlight`: selected historical loading behavior.
  - `useMoonlightView`: coordinator selecting active mode.
- Why:
  - Clear ownership and easier testing.
  - Keeps mode-specific policy in one place.

### D5. Shared widgets across modes

- Decision:
  - Reuse `MoonlightDisplayWidget` and `MoonlightEntryWidget` for both today and history.
- Why:
  - Consistent UX.
  - Lower maintenance and reduced drift.

### D6. Date picker technology choice

- Decision:
  - Use shadcn Calendar (implemented on top of `react-day-picker`).
  - Keep the calendar in a lazy-loaded history drawer.
- Why:
  - Supports required date highlighting (`availableDates`) without custom calendar logic.
  - Aligns with existing shadcn-based UI and theming conventions.
  - Reduces integration risk versus introducing a separate visual/design system.
  - Preserves initial page performance by deferring calendar code until History is opened.

#### Date Picker Decision Matrix

| Option                               | Highlight Available Dates   | UI Consistency With Current Stack | Initial Render Impact | Complexity / Maintenance | Decision     |
| ------------------------------------ | --------------------------- | --------------------------------- | --------------------- | ------------------------ | ------------ |
| shadcn Calendar (`react-day-picker`) | Strong (built-in modifiers) | Strong                            | Low when lazy-loaded  | Medium-low               | **Selected** |
| Native `input[type=date]`            | Weak / inconsistent         | Medium                            | Very low              | Low                      | Rejected     |
| Alternative full date picker library | Varies                      | Medium-low                        | Medium-high           | Medium-high              | Rejected     |

Notes:

1. `react-day-picker` is the official underlying engine for shadcn Calendar.
2. The selected option balances capability (highlighted dates), consistency, and performance.

## Architecture Changes

### UI Layer

- Drawer remains in header options and is lazy-loaded.
- Drawer responsibilities:
  - month availability fetch
  - date selection
  - set selected history date atom
  - close

### State Layer

- Add atom for selected historical date.
- Main page reads mode from coordinator hook.

### Hook Layer

- Add dedicated today hook.
- Add dedicated historical hook.
- Add coordinator hook for render decision.

## Empty-State Policy

### Today mode

- Preserve current behavior:
  - encourage user input/learning
  - existing time-window and generation affordance logic remains

### History mode

- If no reflections available for selected date:
  - show: `No reflections, unable to generate.`
- Historical generation control will be handled in a follow-up increment.

## API and Service Notes

1. Availability endpoint remains month-scoped (`/api/moonlight/dates`).
2. Selected historical read uses date-scoped endpoint (`/api/moonlight/date`).
3. Drawer and page should consume service-layer functions, not inline fetch calls.
4. History endpoints continue using shared 20/min rate limit strategy.

## Testing Strategy

1. Drawer test verifies:
   - availability loading
   - date selection side-effect (atom update + drawer close)
2. Moonlight page test verifies:
   - history mode renders moonlight content on main page
   - history empty mode renders entry widget history variant
3. Hook-level tests may be added if coordinator complexity grows.

## Risks and Mitigations

1. Risk: stale selected history date after navigation.
   - Mitigation: explicit clear action (go back to today) in follow-up.
2. Risk: duplication between today and history fetch behavior.
   - Mitigation: keep all branching in coordinator hook.
3. Risk: policy drift on empty states.
   - Mitigation: centralize variant handling in entry widget.

## Alternatives Considered

1. Render selected moonlight inside drawer.
   - Rejected: mixed responsibilities and weaker continuity.
2. Keep one large moonlight hook for all behavior.
   - Rejected: growing complexity and lower testability.
3. Route split (`/moonlight/history`).
   - Rejected: unnecessary routing overhead for this scope.

## Open Questions

1. Should selecting a date always close drawer, or be configurable?
2. Should history mode include a persistent badge/label indicating active selected date?
3. Should today mode auto-resume when selected date becomes invalid/unavailable?

## Success Metrics

1. Reduced UI state duplication (drawer vs page).
2. Stable render behavior between today and history in tests.
3. Lower regression rate for moonlight mode switching.
4. Faster iteration path for history generation follow-up.
