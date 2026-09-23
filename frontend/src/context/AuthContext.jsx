import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authApi } from '../services/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from cached profile if present for instantaneous render
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('milkmaatu_auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load and refresh user profile from backend
  const fetchProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      if (profile) {
        setUser(profile);
        try {
          localStorage.setItem('milkmaatu_auth_user', JSON.stringify(profile));
        } catch (e) {
          // ignore localStorage quota error
        }
        return profile;
      }
    } catch (err) {
      console.warn('Failed to load backend profile:', err);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial session retrieval
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        if (initialSession) {
          await fetchProfile();
        } else {
          setUser(null);
          localStorage.removeItem('milkmaatu_auth_user');
        }
      } catch (err) {
        console.error('Error during initial auth setup:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession) {
          await fetchProfile();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('milkmaatu_auth_user');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await authApi.signIn({ email, password });
      setSession(res.session);
      if (res.profile) {
        setUser(res.profile);
        localStorage.setItem('milkmaatu_auth_user', JSON.stringify(res.profile));
      } else {
        await fetchProfile();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async ({ email, password, name, phone, address }) => {
    setLoading(true);
    try {
      const res = await authApi.signUp({ email, password, name, phone, address });
      if (res.session) {
        setSession(res.session);
        await fetchProfile();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authApi.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('milkmaatu_auth_user');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    const updated = await authApi.updateProfile(profileData);
    if (updated) {
      setUser(updated);
      localStorage.setItem('milkmaatu_auth_user', JSON.stringify(updated));
    }
    return updated;
  };

  // Construct effective user with safe fallback to session user metadata if backend profile is still loading
  const effectiveUser = user || (session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.name || '',
    phone: session.user.user_metadata?.phone || '',
    address: session.user.user_metadata?.address || '',
    role: session.user.app_metadata?.role || session.user.user_metadata?.role || 'user',
  } : null);

  const userRole = effectiveUser?.role || session?.user?.app_metadata?.role || session?.user?.user_metadata?.role;
  const isAuthenticated = Boolean(session || effectiveUser);
  const isAdmin = Boolean(userRole === 'admin' || userRole === 'super_admin');
  const isSuperAdmin = Boolean(userRole === 'super_admin');

  const value = {
    user: effectiveUser,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
