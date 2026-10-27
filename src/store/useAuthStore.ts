import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  linkGoogle: () => Promise<void>;
  linkGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; message?: string; error?: string }>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

function formatAuthError(errorMsg: string): string {
  if (errorMsg.includes('Invalid login credentials')) {
    return 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
  }
  if (errorMsg.includes('Email not confirmed')) {
    return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki aktivasyon bağlantısına tıklayın.';
  }
  if (errorMsg.includes('User already registered') || errorMsg.includes('already registered')) {
    return 'Bu e-posta adresiyle zaten kayıtlı bir hesap var. Lütfen giriş yapın.';
  }
  if (errorMsg.includes('Password should be at least')) {
    return 'Şifre en az 6 karakter olmalıdır.';
  }
  if (errorMsg.includes('email_address_invalid') || errorMsg.includes('is invalid')) {
    return 'Lütfen geçerli bir e-posta adresi girin.';
  }
  if (errorMsg.includes('rate limit')) {
    return 'Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyin.';
  }
  return errorMsg;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ error: formatAuthError(error.message), isLoading: false });
    } else {
      set({ user: data.session?.user ?? data.user ?? null, isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: formatAuthError(error.message), isLoading: false });
    } else {
      set({ user: data.user, isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  },

  signInWithGitHub: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  },

  linkGoogle: async () => {
    await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  },

  linkGitHub: async () => {
    await supabase.auth.linkIdentity({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || 'Hesap silinemedi.', isLoading: false });
        return { success: false, error: data.error };
      }
      set({ user: null, isLoading: false });
      return { success: true, message: data.message };
    } catch {
      set({ error: 'Bağlantı hatası.', isLoading: false });
      return { success: false, error: 'Bağlantı hatası.' };
    }
  },
}));
