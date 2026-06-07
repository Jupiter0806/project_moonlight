# RFC 2026-06-06: Reflection Drawer Missing-Reflection Fetch and Immediate Open UX

## Metadata

- Status: Proposed
- Authors: Moonlight team
- Created: 2026-06-06
- Target branch: dev (against origin/main)
- Related RFCs:
  - 2026-05-24 Moonlight History View Coordination and Date Picker
- Related areas:
  - src/features/reflections/reflection-traces-drawer.tsx
  - src/features/moonlight/moonlight-display-widget.tsx
  - src/lib/reflections-services.ts
  - src/app/api/reflections/[reflectionId]/route.ts

## Summary

This RFC introduces a consistent drawer-open flow for reflection tokens embedded in Moonlight summaries:

1. Reflection links open the traces drawer immediately.
2. Drawer wrapper resolves the reflection from normalized Redux entities.
3. If the reflection entity is missing, wrapper fetches it from server by id.
4. Drawer shows in-panel loading skeletons while resolving reflection data.
5. After reflection resolution, drawer fetches traces and renders the trace list.

The goal is to avoid dead links and reduce perceived latency by acknowledging user intent immediately.

## Problem

Before this change, reflection token links in Moonlight summary depended on local entity presence:

1. If reflection existed in Redux entities, drawer open worked.
2. If reflection was missing, users saw a degraded/placeholder interaction.
3. The interaction could delay opening until prefetch completed, weakening responsiveness.

This created inconsistency between token links and reflection cards, and reduced trust in token-driven navigation.

## Goals

1. Keep token click interaction immediate and deterministic.
2. Make reflection id the only caller contract for drawer invocation.
3. Resolve missing reflection lazily inside drawer wrapper.
4. Keep drawer view component focused on rendering concerns.
5. Hydrate normalized Redux entities from fetched reflection payload.
6. Preserve existing trace fetch and fetch-status propagation behavior.

## Non-Goals

1. Full trace pagination redesign.
2. Reflection prefetch at Moonlight render time.
3. New route-level navigation for reflection details.
4. Changing reflection data model.

## User Stories

1. As a user, when I click a reflection token, the drawer opens immediately.
2. As a user, if the app has not cached that reflection yet, I still see progress feedback in the drawer.
3. As a user, once data arrives, I see reflection traces without needing a second click.

## Decision Record

### D1. reflectionId-only drawer contract

- Decision:
  - Reflection drawer callers pass only reflectionId, open, onClose.
- Why:
  - Removes ambiguous dual input (entity plus id).
  - Prevents divergence between caller state and normalized store state.

### D2. Wrapper resolves entity and performs fallback fetch

- Decision:
  - ReflectionTracesDrawer acts as controller wrapper:
    - lookup in Redux entities
    - fallback getReflection query when missing
    - upsertReflections on success
- Why:
  - Centralizes fetch-on-miss policy in one place.
  - Avoids scattered ad hoc fallback behavior across features.

### D3. Immediate drawer open over pre-open prefetch

- Decision:
  - Click handlers set open=true immediately.
  - Loading UI is shown inside drawer while resolving reflection.
- Why:
  - Better interaction responsiveness.
  - Better alignment with user intent and perceived performance.

### D4. Pure presentational drawer view under wrapper

- Decision:
  - Keep rendering surface in a dedicated view function receiving resolved data + loading flags.
- Why:
  - Improves separation between orchestration and visual concerns.
  - Easier unit testing and future UI adjustments.

### D5. Add dedicated single-reflection API endpoint

- Decision:
  - Add GET /api/reflections/[reflectionId] with auth + rate-limit + ownership check.
- Why:
  - Provides precise fetch primitive for id-targeted hydration.
  - Avoids overfetch from paginated list endpoints.

## Architecture Changes

### Client

- Updated Moonlight token flow:
  - src/features/moonlight/moonlight-display-widget.tsx
  - Token click opens drawer immediately.
  - Drawer receives reflectionId only.

- Updated reflection drawer structure:
  - src/features/reflections/reflection-traces-drawer.tsx
  - Wrapper: entity resolution + missing-reflection fetch + store hydration.
  - View: loading skeleton and trace list rendering.

- Added reflection-by-id service call:
  - src/lib/reflections-services.ts
  - getReflection(reflectionId)

### API

- Added endpoint:
  - src/app/api/reflections/[reflectionId]/route.ts

- Behavior:
  - 401 for unauthorized.
  - 429 for rate-limited.
  - 404 when missing or not owned by authenticated user.
  - 200 with serialized reflection payload on success.

## API Contract

### GET /api/reflections/[reflectionId]

- Auth: required session cookie.
- Response on success:
  - Reflection object (serialized Firestore values).
- Errors:
  - 401 Unauthorized
  - 404 Reflection not found (or not owner)
  - 429 Too many requests
  - 500 Server error

## Security and Reliability

1. Ownership is enforced by uid comparison before response.
2. Existing reflections rate limiter is reused.
3. Error responses remain generic for missing/not-owned resource to avoid leaking data.
4. Wrapper hydration path keeps store and UI consistent after late entity arrival.

## Testing Coverage

Implemented tests:

1. Drawer opens with immediate in-panel loading skeletons when reflection is missing.
2. Wrapper calls getReflection for missing reflection id and only once per render path.
3. upsertReflections hydrates Redux and transitions to trace list rendering.
4. Cached reflection path skips getReflection network call.
5. API route ownership check returns 404 for cross-user access.

Remaining follow-up:

1. Explicit error-state rendering when missing-reflection fetch fails.

## Risks and Mitigations

1. Risk: duplicate requests if drawer opens repeatedly before cache warmup.
   - Mitigation: React Query keying by reflection id + staleTime Infinity.
2. Risk: wrapper grows orchestration complexity over time.
   - Mitigation: maintain wrapper/view separation and keep caller contract minimal.
3. Risk: missing reflection fetch fails and users only see loading skeletons.
   - Mitigation: add explicit error-state UI in follow-up.

## Alternatives Considered

1. Prefetch reflection before opening drawer.
   - Rejected: slower perceived response and no immediate affordance feedback.
2. Continue requiring caller to provide full reflection entity.
   - Rejected: fragile in token-link surfaces where only id is available.
3. Fetch via paginated list endpoint and scan for id.
   - Rejected: overfetch, cursor coupling, and non-deterministic hit behavior.

## Open Questions

1. Should the drawer show a retry CTA when getReflection fails?
2. Should missing-reflection fetch errors be logged to user-facing telemetry?
3. Should getReflection also be exposed via RTK Query endpoint for consistent cache ownership?

## Success Metrics

1. Reduced failed token-click sessions due to missing local reflection entity.
2. Lower time-to-first-visible-feedback after token click.
3. Stable trace drawer open completion rate across cache-hit and cache-miss paths.
