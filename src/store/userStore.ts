import { create } from "zustand";
import type { User } from "@/types";
import * as api from "@/lib/tauri";

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  saveUser: (user: User) => Promise<number>;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const user = await api.getUser();
      set({ user, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  saveUser: async (user: User) => {
    set({ loading: true, error: null });
    try {
      const id = await api.saveUser(user);
      set({ user: { ...user, id }, loading: false });
      return id;
    } catch (err) {
      set({ error: String(err), loading: false });
      throw err;
    }
  },

  setUser: (user) => set({ user }),
}));
