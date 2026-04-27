import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      sessionExpiresAt: null,
      setAuth: (user, token, sessionExpiresAt = null) => set({ user, token, sessionExpiresAt }),
      login: (user, token, sessionExpiresAt = null) => set({ user, token, sessionExpiresAt }),
      logout: () => set({ user: null, token: null, sessionExpiresAt: null }),
    }),
    {
      name: "milkify-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

