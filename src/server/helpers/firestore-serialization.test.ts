import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import {
  serializeFirestoreTimestamp,
  serializeFirestoreValue,
  toFirestoreTimestamp,
  toFirestoreMillis,
} from "./firestore-serialization";

describe("firestore-serialization", () => {
  it("converts Firestore Timestamp-like values to epoch milliseconds recursively", () => {
    const timestamp = {
      toMillis: () => 1712345678901,
    };

    const value = {
      id: "reflection-1",
      createdAt: timestamp,
      updatedAt: timestamp,
      nested: {
        syncedAt: timestamp,
      },
      items: [{ createdAt: timestamp }],
    };

    expect(serializeFirestoreValue(value)).toEqual({
      id: "reflection-1",
      createdAt: 1712345678901,
      updatedAt: 1712345678901,
      nested: {
        syncedAt: 1712345678901,
      },
      items: [{ createdAt: 1712345678901 }],
    });
  });

  it("accepts raw numbers and normalizes Timestamp-like values for cursors", () => {
    expect(toFirestoreMillis(123, "createdAt")).toBe(123);
    expect(
      toFirestoreMillis(
        {
          toMillis: () => 456,
        },
        "createdAt",
      ),
    ).toBe(456);
  });

  it("serializes and restores Firestore Timestamp values for cursors", () => {
    const timestamp = Timestamp.fromMillis(1712345678901);

    expect(serializeFirestoreTimestamp(timestamp, "createdAt")).toEqual({
      _seconds: 1712345678,
      _nanoseconds: 901000000,
    });

    expect(
      toFirestoreTimestamp(
        {
          _seconds: 1712345678,
          _nanoseconds: 901000000,
        },
        "createdAt",
      ).toMillis(),
    ).toBe(1712345678901);
  });
});
