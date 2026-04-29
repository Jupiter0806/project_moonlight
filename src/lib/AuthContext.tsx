"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  setUser as setSessionUser,
  clearUser as clearSessionUser,
} from "@/store/slices/sessionSlice";
import { useAppDispatch } from "@/store/hooks";

interface UserInfo {
  displayName: string;
  photoURL?: string;
}

interface AuthContextValue {
  user: User | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    userInfo: UserInfo,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

// TODO
// passkeys

const AuthContext = createContext<AuthContextValue | null>(null);

function getClientContext() {
  if (typeof Intl === "undefined") return {};
  return {
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        dispatch(setSessionUser(firebaseUser.uid));
      } else {
        dispatch(clearSessionUser());
      }
    });
    return unsubscribe;
  }, [dispatch]);

  // Google's recommended two-call pattern for Firebase session cookies:
  // https://firebase.google.com/docs/auth/admin/manage-sessions
  async function handleRegister(
    email: string,
    password: string,
    userInfo: UserInfo,
  ) {
    // Call 1: credentials go directly from the browser to Firebase Auth servers (Google).
    // Our server never sees the raw password.
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Call 2: exchange the short-lived Firebase ID token (1 hr) for a long-lived
    // HttpOnly session cookie (5 days) issued by our own server.
    // The Admin SDK verifies the token cryptographically before minting the cookie.
    const idToken = await credential.user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        userInfo,
        clientContext: getClientContext(),
      }),
    });
  }

  async function handleSignIn(email: string, password: string) {
    // Call 1: credentials go directly from the browser to Firebase Auth servers (Google)
    // over TLS — our server never sees the raw password.
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Call 2: exchange the short-lived Firebase ID token (1 hr) for a long-lived
    // HttpOnly session cookie (5 days) issued by our own server.
    // The Admin SDK verifies the token cryptographically before minting the cookie.
    const idToken = await credential.user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, clientContext: getClientContext() }),
    });
  }

  async function handleSignOut() {
    const [firebaseResult, sessionResult] = await Promise.allSettled([
      signOut(auth),
      fetch("/api/auth/session", { method: "DELETE" }),
    ]);

    // The session cookie MUST be deleted — it's the security-critical operation
    if (sessionResult.status === "rejected") {
      // Firebase client may already be signed out, but the server cookie is still alive.
      // Throw so the button component re-enables and shows an error.
      throw new Error("Failed to end session. Please try again.");
    }

    // signOut(auth) failed but cookie is gone — server is safe, proceed
    if (firebaseResult.status === "rejected") {
      console.warn("Firebase client sign-out failed:", firebaseResult.reason);
      // Non-fatal — onAuthStateChanged will eventually sync
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        register: handleRegister,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
