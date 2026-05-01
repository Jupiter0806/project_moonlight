import type { Timestamp } from "firebase-admin/firestore";

export interface SerializedFirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface PageCursor {
  createdAt: SerializedFirestoreTimestamp;
  id: string;
}

export interface DecodedPageCursor {
  createdAt: Timestamp;
  id: string;
}

export interface ListParams {
  uid: string;
  direction: "top" | "bottom";
  cursor?: string;
  limit: number;
}
