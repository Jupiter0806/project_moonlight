import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { store } from "@/store/store";
import { selectUserId, selectIsLoggedIn } from "@/store/slices/sessionSlice";

// --- Tests are written against requirements, not implementation ---
// Requirements:
//   1. user is null and loading is true on mount; resolves once Firebase responds
//   2. signIn exchanges the Firebase credential for a server session cookie
//   3. register exchanges the Firebase credential for a server session cookie
//   4. signOut clears the Firebase session and deletes the server session cookie
//   5. After sign-in, sessionSlice.userId is set to the Firebase uid
//   6. After sign-out, sessionSlice.userId is cleared

// ── Firebase mocks ──────────────────────────────────────────────────────────
vi.mock("@/lib/firebase", () => ({ auth: {} }));

const mockUnsubscribe = vi.fn();
let onAuthStateChangedCallback: ((user: unknown) => void) | null = null;

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    onAuthStateChangedCallback = cb;
    return mockUnsubscribe;
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeFirebaseUser(uid: string) {
  return { uid, getIdToken: vi.fn().mockResolvedValue(`token-for-${uid}`) };
}

/** Minimal consumer to expose AuthContext values via the DOM. */
function AuthConsumer() {
  const { user, loading, signIn, register, signOut } = useAuth();
  return (
    <div>
      <span data-testid="uid">{user?.uid ?? "null"}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => signIn("a@b.com", "secret")}>sign-in</button>
      <button onClick={() => register("a@b.com", "secret")}>register</button>
      <button onClick={() => signOut()}>sign-out</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  onAuthStateChangedCallback = null;
  // Reset global fetch mock
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

// ── Tests ───────────────────────────────────────────────────────────────────
describe("AuthContext", () => {
  describe("AuthProvider — rendering", () => {
    it("renders its children", () => {
      render(
        <AuthProvider>
          <span data-testid="child">hello</span>
        </AuthProvider>,
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("useAuth — outside provider", () => {
    it("throws when used outside <AuthProvider>", () => {
      function BadConsumer() {
        useAuth();
        return null;
      }
      // Suppress React's console.error for the expected thrown render error
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      expect(() => render(<BadConsumer />)).toThrow(
        "useAuth must be used inside <AuthProvider>",
      );
      consoleError.mockRestore();
    });
  });

  describe("Req 1 — initial auth state", () => {
    it("loading is true before Firebase resolves", () => {
      renderAuth();
      expect(screen.getByTestId("loading").textContent).toBe("true");
    });

    it("user is null before Firebase resolves", () => {
      renderAuth();
      expect(screen.getByTestId("uid").textContent).toBe("null");
    });

    it("loading becomes false after Firebase resolves with no user", async () => {
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));
      await waitFor(() =>
        expect(screen.getByTestId("loading").textContent).toBe("false"),
      );
    });

    it("user reflects the signed-in Firebase user", async () => {
      const user = makeFirebaseUser("uid-display");
      renderAuth();
      act(() => onAuthStateChangedCallback!(user));
      await waitFor(() =>
        expect(screen.getByTestId("uid").textContent).toBe("uid-display"),
      );
    });

    it("user reverts to null after sign-out", async () => {
      const user = makeFirebaseUser("uid-display");
      renderAuth();
      act(() => onAuthStateChangedCallback!(user));
      await waitFor(() =>
        expect(screen.getByTestId("uid").textContent).toBe("uid-display"),
      );
      act(() => onAuthStateChangedCallback!(null));
      await waitFor(() =>
        expect(screen.getByTestId("uid").textContent).toBe("null"),
      );
    });

    it("unsubscribes from onAuthStateChanged on unmount", () => {
      const { unmount } = renderAuth();
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe("Req 2 — signIn", () => {
    it("calls signInWithEmailAndPassword with the provided credentials", async () => {
      const user = makeFirebaseUser("uid-sign-in");
      (signInWithEmailAndPassword as Mock).mockResolvedValue({ user });
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));

      fireEvent.click(screen.getByText("sign-in"));

      await waitFor(() =>
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          "a@b.com",
          "secret",
        ),
      );
    });

    it("POSTs the Firebase id token to /api/auth/session", async () => {
      const user = makeFirebaseUser("uid-sign-in");
      (signInWithEmailAndPassword as Mock).mockResolvedValue({ user });
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));

      fireEvent.click(screen.getByText("sign-in"));

      await waitFor(() =>
        expect(fetch).toHaveBeenCalledWith(
          "/api/auth/session",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ idToken: "token-for-uid-sign-in" }),
          }),
        ),
      );
    });
  });

  describe("Req 3 — register", () => {
    it("calls createUserWithEmailAndPassword with the provided credentials", async () => {
      const user = makeFirebaseUser("uid-register");
      (createUserWithEmailAndPassword as Mock).mockResolvedValue({ user });
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));

      fireEvent.click(screen.getByText("register"));

      await waitFor(() =>
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          "a@b.com",
          "secret",
        ),
      );
    });

    it("POSTs the Firebase id token to /api/auth/session", async () => {
      const user = makeFirebaseUser("uid-register");
      (createUserWithEmailAndPassword as Mock).mockResolvedValue({ user });
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));

      fireEvent.click(screen.getByText("register"));

      await waitFor(() =>
        expect(fetch).toHaveBeenCalledWith(
          "/api/auth/session",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ idToken: "token-for-uid-register" }),
          }),
        ),
      );
    });
  });

  describe("Req 4 — signOut", () => {
    it("calls Firebase signOut", async () => {
      (firebaseSignOut as Mock).mockResolvedValue(undefined);
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));

      fireEvent.click(screen.getByText("sign-out"));

      await waitFor(() => expect(firebaseSignOut).toHaveBeenCalledOnce());
    });

    it("sends DELETE to /api/auth/session", async () => {
      (firebaseSignOut as Mock).mockResolvedValue(undefined);
      renderAuth();
      act(() => onAuthStateChangedCallback!(null));

      fireEvent.click(screen.getByText("sign-out"));

      await waitFor(() =>
        expect(fetch).toHaveBeenCalledWith("/api/auth/session", {
          method: "DELETE",
        }),
      );
    });
  });

  describe("Req 5 — sessionSlice updated on sign-in", () => {
    it("dispatches setUser to Redux when Firebase user is present", async () => {
      const user = makeFirebaseUser("uid-redux");
      renderAuth();

      act(() => onAuthStateChangedCallback!(user));

      await waitFor(() =>
        expect(selectUserId(store.getState())).toBe("uid-redux"),
      );
      expect(selectIsLoggedIn(store.getState())).toBe(true);
    });
  });

  describe("Req 6 — sessionSlice cleared on sign-out", () => {
    it("dispatches clearUser to Redux when Firebase user is null", async () => {
      const user = makeFirebaseUser("uid-redux");
      renderAuth();
      // sign in first
      act(() => onAuthStateChangedCallback!(user));
      await waitFor(() =>
        expect(selectUserId(store.getState())).toBe("uid-redux"),
      );

      // then sign out
      act(() => onAuthStateChangedCallback!(null));
      await waitFor(() => expect(selectUserId(store.getState())).toBeNull());
      expect(selectIsLoggedIn(store.getState())).toBe(false);
    });
  });
});
