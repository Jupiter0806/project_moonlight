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

interface AuthContextValue {
  user: User | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// TODO
// passkeys

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Google's recommended two-call pattern for Firebase session cookies:
  // https://firebase.google.com/docs/auth/admin/manage-sessions
  async function handleRegister(email: string, password: string) {
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
      body: JSON.stringify({ idToken }),
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
      body: JSON.stringify({ idToken }),
    });
  }

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
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
