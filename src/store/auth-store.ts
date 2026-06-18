// src/store/auth-store.ts
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  initialize: async () => {
    const supabase = createClient();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      set({ 
        user: session?.user ?? null, 
        loading: false 
      });

      // Подписка на изменения
      supabase.auth.onAuthStateChange((event, session) => {
        set({ 
          user: session?.user ?? null, 
          loading: false 
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, loading: false });
    }
  },
}));