import { supabase } from '../../lib/supabase';
import { apiClient } from './apiClient';

export const authApi = {
  // Sign up a new user with Supabase Auth and initialize public.profiles row
  signUp: async ({ email, password, name, phone, address }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          address,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    // If an active session was created, sync the profile immediately to backend
    if (authData.session) {
      try {
        await apiClient.post('/auth/sync-profile', { name, phone, address });
      } catch (err) {
        console.warn('Profile sync post-signup note:', err);
      }
    }

    return authData;
  },

  // Sign in existing user with email and password
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Fetch the backend profile including assigned role (user / admin / super_admin)
    let profile = null;
    try {
      const resp = await apiClient.get('/auth/me');
      profile = resp?.data || null;
    } catch (err) {
      console.warn('Could not fetch backend profile on login:', err);
    }

    return { ...data, profile };
  },

  // Sign out user from Supabase Auth
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error);
    }
  },

  // Fetch current user's profile from FastAPI backend
  getProfile: async () => {
    const resp = await apiClient.get('/auth/me');
    return resp?.data || null;
  },

  // Update profile details (name, phone, address)
  updateProfile: async (profileData) => {
    const resp = await apiClient.put('/auth/profile', profileData);
    return resp?.data || null;
  },

  // Send password reset email
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  // Safe backward-compatible helper to avoid runtime TypeError if called
  getCurrentUser: () => {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          const item = JSON.parse(localStorage.getItem(k) || '{}');
          if (item?.user) return item.user;
        }
      }
    } catch {}
    return null;
  },

  isAdminAuthenticated: () => {
    return false;
  },

  isAuthenticated: () => {
    return Boolean(authApi.getCurrentUser());
  },
};
