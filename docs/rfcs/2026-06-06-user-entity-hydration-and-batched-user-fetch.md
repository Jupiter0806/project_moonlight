# RFC 2026-06-06: User Entity Hydration and Batched User Fetch

## Metadata

- Status: Proposed
- Authors: Moonlight team
- Created: 2026-06-06
- Target branch: dev (against origin/main)
- Related RFCs:
  - 2026-06-06 Reflection Drawer Missing-Reflection Fetch and Immediate Open UX
- Related areas:
  - src/features/user/index.tsx
  - src/features/user/hooks/useHydrateMissingUsers.ts
  - src/features/reflections/reflection-list.tsx
  - src/lib/users-service.ts
  - src/app/api/users/route.ts

## Summary

This RFC defines how the app resolves missing user entities while preventing request fan-out when reflection lists contain many distinct users.

The design combines two coordinated behaviors:

1. Component-level fetch-on-miss fallback for individual user render surfaces.
2. List-level batched hydration of missing users to warm Redux entities before many user cards render.

It also formalizes API/client batch limits and chunking for scalability.

## Problem

Before this change, user entities were mainly hydrated during sign-in/register and from timeline payloads when provided. This left two gaps:

1. Current user could be missing after refresh while session state still had uid.
2. Reflection lists with many distinct user ids could trigger many per-card fetches if each card fetched independently.

This caused inconsistent UX and unnecessary network overhead.

## Goals

1. Ensure missing users can always be resolved on demand.
2. Avoid per-row request storms in list scenarios.
3. Keep Redux `entities.users` as normalized source of truth.
4. Preserve component resilience for non-list surfaces.
5. Bound user batch requests by explicit API limits.

## Non-Goals

1. Replacing existing auth/session architecture.
2. Introducing server-side streaming for users.
3. Changing user entity schema.
4. Cross-tab shared cache synchronization.

## Decision Record

### D1. Keep per-component fallback hydration

- Decision:
  - `User` container fetches by uid on cache miss and upserts into Redux.
- Why:
  - Guarantees correctness for isolated user surfaces.
  - Covers post-refresh cache misses without relying on sign-in flow.

### D2. Add list-level missing-user batch hydration

- Decision:
  - Reflection list invokes `useHydrateMissingUsers(ids)`.
  - Hook computes missing user ids from reflection entities and current users cache.
  - Missing ids are fetched in one batched query and dispatched with one `upsertUsers`.
- Why:
  - Prevents N user API calls for N visible reflections with different users.
  - Improves first-render efficiency for dense reflection feeds.

### D3. Enforce capped batch size and chunking

- Decision:
  - API route caps `userIds` per request at 50 and returns 400 above limit.
  - Client normalizes ids (trim/dedupe/sort) and chunks requests above 50.
- Why:
  - Guards backend and URL size risk.
  - Keeps large hydration requests predictable.

## Architecture Changes

### Client

- Added batched user fetch service behavior in `getUsers`:
  - normalize ids
  - single batch for <= 50
  - chunk + parallel fetch for > 50

- Added list-level user hydration hook:
  - `useHydrateMissingUsers(reflectionIds)`

- Wired list-level hydration in reflection list rendering:
  - `useHydrateMissingUsers(ids)` in reflection list component

- Preserved per-component fallback in `User` container.

### API

- Updated `GET /api/users` route:
  - normalize `userIds`
  - reject request when `userIds.length > 50` with 400

## API Contract

### GET /api/users

- Query: `userIds` comma-separated list
- Auth: required
- Responses:
  - 200: `User[]`
  - 400: too many `userIds` (max 50)
  - 401: unauthorized
  - 429: rate limited
  - 500: server error

## Security and Reliability

1. Endpoint remains auth-protected and rate-limited.
2. 400 guard prevents oversized user-id fan-in requests.
3. Client dedupe avoids redundant user fetches.
4. Redux upsert keeps entity state convergent when fallback and batch paths race.

## Testing Coverage

Implemented coverage includes:

1. `users-service` dedupe + single-batch behavior for <= 50 ids.
2. `users-service` chunking behavior when ids exceed 50.
3. `User` container fetch-on-miss hydration to Redux.
4. `User` container no-fetch behavior when user is already cached.
5. `User` presentation tests after container/view separation.

## Risks and Mitigations

1. Risk: duplicate user fetches between list hydration and per-user fallback.
   - Mitigation: deduped query keys + staleTime + id normalization.
2. Risk: large lists still produce multiple requests.
   - Mitigation: bounded chunk size and API guardrails.
3. Risk: missing users never returned (deleted/private records).
   - Mitigation: UI fallback remains stable (`Guest`) and no hard failure on partial results.

## Alternatives Considered

1. Only per-user fetch-on-miss without list batching.
   - Rejected: causes request fan-out in feed scenarios.
2. Only list-level batching without per-user fallback.
   - Rejected: fragile for non-list user surfaces.
3. Server-injected users for every reflection list response.
   - Rejected for now: larger payloads and tighter coupling of list and user concerns.

## Open Questions

1. Should `useHydrateMissingUsers` include viewport-based id scoping for virtualized lists?
2. Should user hydration errors be surfaced to telemetry for cache-miss diagnosis?
3. Should we move user fetch orchestration to RTK Query endpoints for unified cache ownership?

## Success Metrics

1. Reduced number of `/api/users` requests per reflection-list session.
2. Improved user name/avatar resolution rate after refresh.
3. Lower median time to fully hydrated reflection rows.
