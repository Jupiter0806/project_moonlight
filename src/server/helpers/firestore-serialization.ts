import { Timestamp } from "firebase-admin/firestore";

type TimestampLike = {
  toMillis: () => number;
};

type TimestampPartsLike = {
  seconds: number;
  nanoseconds: number;
};

export interface SerializedFirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    value !== null &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  );
}

function hasTimestampParts(value: unknown): value is TimestampPartsLike {
  return (
    value !== null &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number" &&
    "nanoseconds" in value &&
    typeof (value as { nanoseconds?: unknown }).nanoseconds === "number"
  );
}

export function isSerializedFirestoreTimestamp(
  value: unknown,
): value is SerializedFirestoreTimestamp {
  return (
    value !== null &&
    typeof value === "object" &&
    "_seconds" in value &&
    typeof (value as { _seconds?: unknown })._seconds === "number" &&
    "_nanoseconds" in value &&
    typeof (value as { _nanoseconds?: unknown })._nanoseconds === "number"
  );
}

export function toFirestoreTimestamp(
  value: unknown,
  fieldName = "timestamp",
): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }

  if (isSerializedFirestoreTimestamp(value)) {
    return new Timestamp(value._seconds, value._nanoseconds);
  }

  if (typeof value === "number") {
    return Timestamp.fromMillis(value);
  }

  if (isTimestampLike(value)) {
    return Timestamp.fromMillis(value.toMillis());
  }

  throw new Error(
    `Expected ${fieldName} to be a number or Firestore Timestamp`,
  );
}

export function serializeFirestoreTimestamp(
  value: unknown,
  fieldName = "timestamp",
): SerializedFirestoreTimestamp {
  if (isSerializedFirestoreTimestamp(value)) {
    return value;
  }

  const timestamp = toFirestoreTimestamp(value, fieldName);

  if (hasTimestampParts(timestamp)) {
    return {
      _seconds: timestamp.seconds,
      _nanoseconds: timestamp.nanoseconds,
    };
  }

  throw new Error(`Expected ${fieldName} to expose Firestore Timestamp parts`);
}

export function toFirestoreMillis(
  value: unknown,
  fieldName = "timestamp",
): number {
  if (typeof value === "number") {
    return value;
  }

  if (isTimestampLike(value)) {
    return value.toMillis();
  }

  throw new Error(
    `Expected ${fieldName} to be a number or Firestore Timestamp`,
  );
}

export function serializeFirestoreValue<T>(value: T): T {
  if (isTimestampLike(value)) {
    return value.toMillis() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item)) as T;
  }

  if (value instanceof Date || value === null || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      serializeFirestoreValue(nestedValue),
    ]),
  ) as T;
}
