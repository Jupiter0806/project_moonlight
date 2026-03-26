// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Pagination {
  size: number;
  /** Opaque base64-encoded Firestore document ID. Empty string means last page. */
  cursor: string;
}

export interface PaginatedResponse<T> {
  pagination: Pagination;
  entries: T[];
}

// ─── Core entities ───────────────────────────────────────────────────────────

/** Lightweight reflection returned by GET /reflections. Traces are fetched separately. */
export interface Reflection {
  id: string;
  label: string;
  owner_id: string;
  trace_ids: string[];
}

/** Full reflection document stored in Firestore (includes created_at). */
export interface ReflectionDoc extends Reflection {
  created_at: number; // Unix timestamp (ms)
}

/** Single Q&A pair within a reflection. */
export interface Trace {
  id: string;
  created_time: number; // Unix timestamp (ms)
  q: string;
  a: string;
}

/** Full Trace document stored in Firestore (includes reflection_id for querying). */
export interface TraceDoc extends Trace {
  reflection_id: string;
  owner_id: string;
}

/** User identity (derived from Firebase Auth token). */
export interface User {
  id: string;
  name: string;
}

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface CreateTraceInput {
  q: string;
  a: string;
  created_time: number;
}

export interface CreateReflectionInput {
  label: string;
  traces: CreateTraceInput[];
}

// ─── Hono context variables ───────────────────────────────────────────────────

import type { DecodedIdToken } from "firebase-admin/auth";

export interface AppVariables {
  user: DecodedIdToken;
}
