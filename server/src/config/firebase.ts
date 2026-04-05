import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initFirebase() {
  if (getApps().length > 0) {
    return;
  }

  const useEmulator = process.env.USE_FIREBASE_EMULATOR === "true";

  if (useEmulator) {
    // Emulator: no credentials needed
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID ?? "demo-moonlight",
    });
  } else {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (!b64) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 env var is required",
      );
    }
    const serviceAccount = JSON.parse(
      Buffer.from(b64, "base64").toString("utf8"),
    ) as object;

    initializeApp({
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    });
  }
}

// todo
// init at build time, is it good?
initFirebase();

export const db = getFirestore();
export const auth = getAuth();
