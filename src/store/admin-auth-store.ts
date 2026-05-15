"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AdminAuthState = {
  token: string | null;
  username: string | null;
  setSession: (token: string, username: string) => void;
  clearSession: () => void;
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      setSession: (token, username) => set({ token, username }),
      clearSession: () => set({ token: null, username: null }),
    }),
    {
      name: "atelier-admin-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
