// src/store/auth-store.ts
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  user: any | null;
  loading: boolean;
  setUser: (user: any) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),

  initialize: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    set({ 
      user: session?.user || null, 
      loading: false 
    });

    // Подписка на изменения авторизации
    supabase.auth.onAuthStateChange((event, session) => {
      set({ 
        user: session?.user || null, 
        loading: false 
      });
    });
  },
}));