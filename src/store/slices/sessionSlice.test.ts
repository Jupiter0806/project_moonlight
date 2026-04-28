import { describe, it, expect, beforeEach, afterEach } from "vitest";
import sessionReducer, {
  setUser,
  clearUser,
  selectUserId,
  selectGuestId,
  selectIsLoggedIn,
  selectActiveUserId,
  getOrCreateGuestId,
} from "./sessionSlice";
import type { RootState } from "@/store/store";

// --- Tests are written against requirements, not implementation ---
// Requirements:
//   1. userId is null and isLoggedIn is false before sign-in
//   2. setUser records the Firebase uid and marks the session as logged in
//   3. clearUser removes the uid and marks the session as logged out
//   4. guestId is stable: same value is returned across calls (localStorage persisted)
//   5. guestId is preserved after sign-out
//   6. selectActiveUserId returns uid when logged in, guestId otherwise

const GUEST_ID_KEY = "moonlight:guestId";

function makeRootState(
  partial: Partial<{
    userId: string | null;
    guestId: string;
    isLoggedIn: boolean;
  }>,
): RootState {
  return {
    session: {
      userId: null,
      guestId: "guest-123",
      isLoggedIn: false,
      ...partial,
    },
  } as RootState;
}

describe("sessionSlice", () => {
  describe("initial state", () => {
    it("userId is null before sign-in", () => {
      const state = sessionReducer(undefined, { type: "@@INIT" });
      expect(state.userId).toBeNull();
    });

    it("isLoggedIn is false before sign-in", () => {
      const state = sessionReducer(undefined, { type: "@@INIT" });
      expect(state.isLoggedIn).toBe(false);
    });

    it("guestId is a non-empty string", () => {
      const state = sessionReducer(undefined, { type: "@@INIT" });
      expect(typeof state.guestId).toBe("string");
      expect(state.guestId.length).toBeGreaterThan(0);
    });
  });

  describe("setUser", () => {
    it("sets userId to the provided uid", () => {
      const state = sessionReducer(undefined, setUser("uid-abc"));
      expect(state.userId).toBe("uid-abc");
    });

    it("sets isLoggedIn to true", () => {
      const state = sessionReducer(undefined, setUser("uid-abc"));
      expect(state.isLoggedIn).toBe(true);
    });

    it("does not change guestId", () => {
      const before = sessionReducer(undefined, { type: "@@INIT" });
      const after = sessionReducer(before, setUser("uid-abc"));
      expect(after.guestId).toBe(before.guestId);
    });

    it("replaces a previous userId when called again", () => {
      let state = sessionReducer(undefined, setUser("uid-first"));
      state = sessionReducer(state, setUser("uid-second"));
      expect(state.userId).toBe("uid-second");
    });
  });

  describe("clearUser", () => {
    it("sets userId back to null", () => {
      let state = sessionReducer(undefined, setUser("uid-abc"));
      state = sessionReducer(state, clearUser());
      expect(state.userId).toBeNull();
    });

    it("sets isLoggedIn to false", () => {
      let state = sessionReducer(undefined, setUser("uid-abc"));
      state = sessionReducer(state, clearUser());
      expect(state.isLoggedIn).toBe(false);
    });

    it("preserves guestId after sign-out", () => {
      const initial = sessionReducer(undefined, { type: "@@INIT" });
      let state = sessionReducer(initial, setUser("uid-abc"));
      state = sessionReducer(state, clearUser());
      expect(state.guestId).toBe(initial.guestId);
    });
  });

  describe("getOrCreateGuestId — localStorage persistence", () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it("generates a non-empty id when localStorage is empty", () => {
      const id = getOrCreateGuestId();
      expect(id).toBeTruthy();
    });

    it("persists the generated id to localStorage", () => {
      const id = getOrCreateGuestId();
      expect(localStorage.getItem(GUEST_ID_KEY)).toBe(id);
    });

    it("returns the same id on repeated calls (stable across sessions)", () => {
      const first = getOrCreateGuestId();
      const second = getOrCreateGuestId();
      expect(second).toBe(first);
    });

    it("reuses an existing id already stored in localStorage", () => {
      localStorage.setItem(GUEST_ID_KEY, "stored-guest-id");
      const id = getOrCreateGuestId();
      expect(id).toBe("stored-guest-id");
    });
  });

  describe("selectors", () => {
    describe("selectUserId", () => {
      it("returns null when not signed in", () => {
        expect(selectUserId(makeRootState({ userId: null }))).toBeNull();
      });

      it("returns the uid when signed in", () => {
        expect(selectUserId(makeRootState({ userId: "uid-xyz" }))).toBe(
          "uid-xyz",
        );
      });
    });

    describe("selectGuestId", () => {
      it("returns the guestId from state", () => {
        expect(selectGuestId(makeRootState({ guestId: "guest-abc" }))).toBe(
          "guest-abc",
        );
      });
    });

    describe("selectIsLoggedIn", () => {
      it("returns false when not signed in", () => {
        expect(selectIsLoggedIn(makeRootState({ isLoggedIn: false }))).toBe(
          false,
        );
      });

      it("returns true when signed in", () => {
        expect(selectIsLoggedIn(makeRootState({ isLoggedIn: true }))).toBe(
          true,
        );
      });
    });

    describe("selectActiveUserId", () => {
      it("returns guestId when not signed in", () => {
        expect(
          selectActiveUserId(
            makeRootState({ userId: null, guestId: "guest-123" }),
          ),
        ).toBe("guest-123");
      });

      it("returns userId when signed in", () => {
        expect(
          selectActiveUserId(
            makeRootState({
              userId: "uid-abc",
              guestId: "guest-123",
              isLoggedIn: true,
            }),
          ),
        ).toBe("uid-abc");
      });
    });
  });
});
