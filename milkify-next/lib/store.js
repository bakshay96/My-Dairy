import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      sessionStartedAt: null,
      // Primary setter — used everywhere
      setAuth: (user, token) => set({ user, token, sessionStartedAt: Date.now() }),
      // Alias for backward compatibility
      login: (user, token) => set({ user, token, sessionStartedAt: Date.now() }),
      logout: () => set({ user: null, token: null, sessionStartedAt: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
