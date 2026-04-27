import { create } from "zustand";

export const useAuthStore = create(
  (set) => ({
    user: null,
    token: null,
    sessionExpiresAt: null,
    // Primary setter — used everywhere
    setAuth: (user, token, sessionExpiresAt = null) => set({ user, token, sessionExpiresAt }),
    // Alias for backward compatibility
    login: (user, token, sessionExpiresAt = null) => set({ user, token, sessionExpiresAt }),
    logout: () => set({ user: null, token: null, sessionExpiresAt: null }),
  })
);
