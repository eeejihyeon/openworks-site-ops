import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Role } from "@/lib/mock/db";

export interface CurrentUser {
  id: string;
  name: string;
  department: string;
  role: Role;
}

interface AuthState {
  user: CurrentUser | null;
  token: string | null;
  login: (user: CurrentUser, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => {
        localStorage.setItem("access_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        set({ user: null, token: null });
      },
      isAdmin: () => get().user?.role === "관리자",
    }),
    { name: "facility-auth" }
  )
);
