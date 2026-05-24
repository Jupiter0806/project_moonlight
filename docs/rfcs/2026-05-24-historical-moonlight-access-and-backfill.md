# RFC 2026-05-24: Historical Moonlight Access and On-Demand Backfill

## Metadata

- Status: Proposed
- Authors: Moonlight team
- Created: 2026-05-24
- Target branch: feature/moonligh-history (against origin/dev)
- Related commits:
  - 3eac70e
  - 58b0837
  - 3439c34
  - dd257ae
  - 43ffbb0
  - ff1a254
  - f9d70c1
  - 34e1f85
  - fe65afa
  - bf1f331
  - f464ca8
  - 5ea35b6
  - 298350d

## Summary

This RFC introduces a historical Moonlight experience that allows users to:

1. Browse dates with available Moonlight data for a selected month.
2. Open historical Moonlight for a selected date.
3. Generate a Moonlight summary for that date when no summary exists but reflections exist.
4. Return to the default Today view seamlessly.

The design also adds a per-day reflection aggregate to improve date availability accuracy even when Moonlight has not been generated yet.

## Problem

Before this change, Moonlight was primarily today-focused. Users could not reliably:

1. Discover past dates with learning activity.
2. Read past Moonlight summaries from the main Moonlight experience.
3. Backfill missing historical Moonlight entries for days that already had reflections.

This created data visibility gaps and reduced trust in the review workflow.

## Goals

1. Provide a clear history entry point from Moonlight UI.
2. Make historical date discovery efficient and timezone-aware.
3. Support read-first behavior for existing historical Moonlight.
4. Support generate-if-missing behavior when a day has reflections.
5. Keep APIs authenticated, rate-limited, and predictable.
6. Preserve current Today behavior and allow easy return from History mode.

## Non-Goals

1. Editing historical summaries.
2. Bulk generation for date ranges.
3. Automatic retro-generation for all missing days.
4. New long-term analytics dashboards.

## User Stories

1. As a user, I can open Moonlight history and select a past day from a calendar.
2. As a user, when historical Moonlight exists, I can view it immediately.
3. As a user, when historical Moonlight is missing but reflections exist, I can generate it from the selected day.
4. As a user, I can return to Today mode with one action.

## Decision Record

### D1. Separate discovery and content APIs

- Decision:
  - `GET /api/moonlight/dates?month=YYYY-MM` for date availability.
  - `GET /api/moonlight/date?date=YYYY-MM-DD` for historical read.
  - `POST /api/moonlight/date?date=YYYY-MM-DD` for historical generation.
- Why:
  - Keeps payloads minimal by concern.
  - Improves cacheability and failure isolation.
  - Enables fine-grained UX loading states.

### D2. Generate-if-missing is explicit

- Decision:
  - `GET /date` returns `exists` and `canGenerate`.
  - Client decides whether to show generation CTA.
  - `POST /date` returns 400 with `NO_REFLECTIONS` semantics when no source reflections exist.
- Why:
  - Avoids hidden side effects on read.
  - Preserves user intent and predictable API contracts.

### D3. Timezone-aware day windows with a 02:00 boundary

- Decision:
  - Date windows are computed using user timezone (`x-user-timezone`, fallback UTC).
  - Day windows for moonlight generation are aligned to 02:00 local boundary logic.
- Why:
  - Better matches late-night usage and avoids accidental day splits around midnight.
  - Consistent behavior across geographies and DST transitions.

### D4. Availability from two sources

- Decision:
  - Available history dates are merged from:
    - Existing `moonlight/{uid}/daily` docs.
    - `moonlightReflectionDailyCounts/{uid}/daily/{YYYY-MM-DD}` aggregate docs.
- Why:
  - Users can discover days with reflections even if Moonlight was never generated.
  - Enables generation CTA for missing summaries on valid days.

### D5. Increment aggregate at reflection flush time

- Decision:
  - `flushChamberTraces` increments per-day reflection aggregate in the same batch as reflection/traces write.
- Why:
  - Tightens eventual consistency between reflection creation and calendar availability.
  - Reduces expensive range scans for date availability.

### D6. History mode as state overlay, not route split

- Decision:
  - Maintain current Moonlight page route.
  - Use selected history date atom to switch view mode (today/history).
  - Add clear action: "Go back to today".
- Why:
  - Avoids unnecessary route complexity.
  - Maintains user context and fast transitions.

## Architecture Changes

### API Layer

- Added:
  - `src/app/api/moonlight/dates/route.ts`
  - `src/app/api/moonlight/date/route.ts`
- Behavior:
  - Validation for month/date formats.
  - Authentication required.
  - Rate limits on history endpoints.
  - Server errors normalized to 500.

### Server Domain Layer

- Added historical moonlight module:
  - `src/server/moonlight/history/shared.ts`
  - `src/server/moonlight/history/listMoonlightHistoryDates.ts`
  - `src/server/moonlight/history/getMoonlightHistoryByDate.ts`
  - `src/server/moonlight/history/generateMoonlightHistoryByDate.ts`
  - `src/server/moonlight/history/reflectionDailyAggregate.ts`
- Added export surface:
  - `src/server/moonlight/listMoonlightHistoryDates.ts`

### Client Layer

- Added Moonlight history drawer and calendar selection flow.
- Added history data utilities for stable local date parsing/formatting.
- Added history-aware state hooks:
  - `useHistoricalMoonlight`
  - `useMoonlightView`
- Updated Moonlight widget to render either today or selected history state.

## Data Model

### Existing collection reused

- `moonlight/{uid}/daily/{dayKey}`
  - `dayKey` is derived from timezone/day-window start millis.
  - Includes `summary`, `reflectionIds`, `reflectionCount`, timestamps.

### New aggregate collection

- `moonlightReflectionDailyCounts/{uid}/daily/{YYYY-MM-DD}`
  - `date`: date key
  - `count`: incrementing reflection count
  - `updatedAt`: server timestamp

## API Contract

### GET /api/moonlight/dates

- Query: `month=YYYY-MM` (optional, defaults current month)
- Response:
  - `status: "ok"`
  - `month`
  - `availableDates: string[]`

### GET /api/moonlight/date

- Query: `date=YYYY-MM-DD` (required)
- Response:
  - `status: "ok"`
  - `date`
  - `exists`
  - `canGenerate`
  - `moonlight?`

### POST /api/moonlight/date

- Query: `date=YYYY-MM-DD` (required)
- Response:
  - `status: "ok"`
  - `date`
  - `generated`
  - `moonlight`
- Error:
  - 400 when source reflections do not exist for selected day.

## Security and Reliability

1. Auth is enforced for all moonlight history endpoints.
2. Endpoint-specific rate limiting protects availability.
3. Validation rejects invalid date and month formats.
4. Historical generation handles no-reflection cases explicitly.

## Testing Coverage

Implemented tests cover:

1. API routes for auth, validation, rate limit, success paths, and no-reflection failures.
2. History data parsing/format utilities (stable local-noon date handling).
3. Drawer loading states, available-date injection, and date selection side effects.
4. Moonlight widget mode-switch behavior and return-to-today control.
5. Chamber flush aggregate write behavior supporting history availability.

## Rollout Plan

1. Merge feature branch into `dev` behind existing auth/rate-limit controls.
2. Monitor endpoint errors and generation failure rates for `/api/moonlight/date`.
3. Validate timezone headers and day-window behavior in production telemetry.
4. Collect user feedback on calendar discoverability and generation affordance.

## Risks and Mitigations

1. Risk: timezone edge cases around DST and cross-zone travel.
   - Mitigation: canonical helper functions and explicit timezone fallback to UTC.
2. Risk: aggregate/date availability divergence.
   - Mitigation: aggregate increment is part of flush batch write.
3. Risk: accidental over-generation traffic.
   - Mitigation: rate limiting + explicit user-triggered generation.

## Alternatives Considered

1. Auto-generate on `GET /api/moonlight/date` when missing.
   - Rejected: side effects on reads, harder error semantics, less predictable UX.
2. Infer available dates only from moonlight docs.
   - Rejected: cannot discover days with reflections but no generated summary.
3. Dedicated route for history page.
   - Rejected: additional routing complexity and weaker continuity from today view.

## Open Questions

1. Should historical generation be blocked by a time-of-day policy, or remain unrestricted for past dates?
2. Do we need admin tooling to repair aggregate documents for legacy data?
3. Should history APIs return lightweight observability metadata (for example generation source)?

## Success Metrics

1. Historical Moonlight open rate from Moonlight page.
2. Conversion from `exists=false && canGenerate=true` to successful generation.
3. Error rate for `/api/moonlight/date` and `/api/moonlight/dates`.
4. Share of history sessions that return to Today mode in same visit.
