import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async (email: string, password: string) => {
    const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        set({ user: profile });
      }
    }
  },
  signUp: async (email: string, password: string, fullName: string) => {
    const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) throw signUpError;

    if (authUser) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authUser.id,
          full_name: fullName,
          role: 'user'
        }])
        .select()
        .single();

      if (profileError) throw profileError;
      if (profile) {
        set({ user: profile });
      }
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  loadUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({ user: profile, isLoading: false });
        } else {
          set({ user: null, isLoading: false });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ user: null, isLoading: false });
    }
  },
}));