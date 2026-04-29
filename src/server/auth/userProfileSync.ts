import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export interface ClientContext {
  locale?: string;
  timeZone?: string;
}

export interface UserProfileDoc {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  providerIds: string[];
  clientContext: ClientContext;
  authUpdatedAt: FirebaseFirestore.FieldValue;
  lastLoginAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
  createdAt: FirebaseFirestore.FieldValue;
}

type UserInfo = Pick<UserProfileDoc, "displayName" | "photoURL">;

export function sanitizeClientContext(input: unknown): ClientContext {
  if (!input || typeof input !== "object") return {};

  const candidate = input as Record<string, unknown>;
  const locale =
    typeof candidate.locale === "string" && candidate.locale.length <= 32
      ? candidate.locale
      : undefined;
  const timeZone =
    typeof candidate.timeZone === "string" && candidate.timeZone.length <= 64
      ? candidate.timeZone
      : undefined;

  return { locale, timeZone };
}

export function sanitizeUserInfo(input: unknown): UserInfo {
  if (!input || typeof input !== "object")
    return { displayName: "", photoURL: null };

  const candidate = input as Record<string, unknown>;
  const displayName =
    typeof candidate.displayName === "string" &&
    candidate.displayName.length <= 32
      ? candidate.displayName
      : "";
  const photoURL =
    typeof candidate.photoURL === "string" && candidate.photoURL.length <= 256
      ? candidate.photoURL
      : null;

  return { displayName, photoURL };
}

export function buildUserProfileDoc(
  decodedToken: DecodedIdToken,
  clientContext: ClientContext,
  userInfo: UserInfo,
): UserProfileDoc {
  const firebaseClaim =
    decodedToken.firebase && typeof decodedToken.firebase === "object"
      ? (decodedToken.firebase as Record<string, unknown>)
      : undefined;

  const identities =
    firebaseClaim && typeof firebaseClaim.identities === "object"
      ? (firebaseClaim.identities as Record<string, unknown>)
      : undefined;

  const providerIds = identities ? Object.keys(identities) : [];

  return {
    uid: decodedToken.uid,
    email: decodedToken.email ?? null,
    emailVerified: Boolean(decodedToken.email_verified),
    displayName:
      userInfo.displayName ||
      (typeof decodedToken.name === "string" ? decodedToken.name : null),
    photoURL:
      userInfo.photoURL ||
      (typeof decodedToken.picture === "string" ? decodedToken.picture : null),
    providerIds,
    clientContext,
    authUpdatedAt: FieldValue.serverTimestamp(),
    lastLoginAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  };
}

export async function upsertUserProfileFromToken(
  db: Firestore,
  decodedToken: DecodedIdToken,
  clientContext: ClientContext,
  userInfo: UserInfo,
): Promise<void> {
  const payload = buildUserProfileDoc(decodedToken, clientContext, userInfo);

  await db
    .collection("users")
    .doc(decodedToken.uid)
    .set(payload, { merge: true });
}
