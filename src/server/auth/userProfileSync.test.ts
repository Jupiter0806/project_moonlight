import { describe, expect, it, vi } from "vitest";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import {
  buildUserProfileDoc,
  sanitizeClientContext,
  upsertUserProfileFromToken,
} from "@/server/auth/userProfileSync";

const makeToken = (): DecodedIdToken =>
  ({
    aud: "demo",
    auth_time: 1,
    exp: 2,
    iat: 1,
    iss: "https://securetoken.google.com/demo",
    sub: "uid-123",
    uid: "uid-123",
    email: "alice@example.com",
    email_verified: true,
    name: "Alice",
    picture: "https://example.com/alice.png",
    firebase: {
      identities: {
        email: ["alice@example.com"],
        "google.com": ["alice@gmail.com"],
      },
      sign_in_provider: "password",
    },
  }) as DecodedIdToken;

describe("sanitizeClientContext", () => {
  it("keeps only supported keys", () => {
    expect(
      sanitizeClientContext({
        locale: "en-US",
        timeZone: "Asia/Taipei",
        email: "spoof@example.com",
      }),
    ).toEqual({ locale: "en-US", timeZone: "Asia/Taipei" });
  });

  it("drops invalid values", () => {
    expect(
      sanitizeClientContext({ locale: 123, timeZone: "x".repeat(200) }),
    ).toEqual({ locale: undefined, timeZone: undefined });
  });
});

describe("buildUserProfileDoc", () => {
  it("uses identity fields from verified token claims", () => {
    const token = makeToken();

    const result = buildUserProfileDoc(token, {
      locale: "en-US",
      timeZone: "Asia/Taipei",
    });

    expect(result.uid).toBe("uid-123");
    expect(result.email).toBe("alice@example.com");
    expect(result.emailVerified).toBe(true);
    expect(result.providerIds).toEqual(["email", "google.com"]);
    expect(result.clientContext).toEqual({
      locale: "en-US",
      timeZone: "Asia/Taipei",
    });
    expect(result.updatedAt).toBe(FieldValue.serverTimestamp());
  });
});

describe("upsertUserProfileFromToken", () => {
  it("writes to users/{uid} with merge", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const doc = vi.fn().mockReturnValue({ set });
    const collection = vi.fn().mockReturnValue({ doc });
    const db = { collection } as unknown as Parameters<
      typeof upsertUserProfileFromToken
    >[0];

    await upsertUserProfileFromToken(db, makeToken(), {
      locale: "en-US",
      timeZone: "Asia/Taipei",
    });

    expect(collection).toHaveBeenCalledWith("users");
    expect(doc).toHaveBeenCalledWith("uid-123");
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(expect.any(Object), {
      mergeFields: [
        "uid",
        "email",
        "emailVerified",
        "providerIds",
        "clientContext",
        "authUpdatedAt",
        "lastLoginAt",
        "updatedAt",
        "createdAt",
      ],
    });
  });
});
