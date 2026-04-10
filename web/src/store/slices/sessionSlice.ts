import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

const GUEST_ID_KEY = "moonlight:guestId";

/**
 * Reads the guest ID from localStorage, or generates and persists a new one.
 * Returns a random UUID on the server (SSR) where localStorage is unavailable —
 * the client will hydrate with the real persisted value on mount.
 */
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  try {
    const stored = localStorage.getItem(GUEST_ID_KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  } catch {
    // localStorage blocked (e.g. private browsing with strict settings)
    return crypto.randomUUID();
  }
}

interface SessionState {
  /** Firebase uid when signed in, otherwise null. */
  userId: string | null;
  /** Stable anonymous identifier persisted in localStorage across sessions. */
  guestId: string;
  isLoggedIn: boolean;
}

const initialState: SessionState = {
  userId: null,
  guestId: getOrCreateGuestId(),
  isLoggedIn: false,
};

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    /** Call after successful Firebase sign-in with the user's uid. */
    setUser: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
      state.isLoggedIn = true;
    },
    /** Call on sign-out. Preserves guestId so it remains stable. */
    clearUser: (state) => {
      state.userId = null;
      state.isLoggedIn = false;
    },
  },
});

export const { setUser, clearUser } = sessionSlice.actions;

export const selectUserId = (state: RootState) => state.session.userId;
export const selectGuestId = (state: RootState) => state.session.guestId;
export const selectIsLoggedIn = (state: RootState) => state.session.isLoggedIn;
/** The uid to use for API calls — Firebase uid when signed in, guestId otherwise. */
export const selectActiveUserId = (state: RootState) =>
  state.session.userId ?? state.session.guestId;

export default sessionSlice.reducer;
