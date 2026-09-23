import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authApi } from '../services/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load and refresh user profile from backend
  const fetchProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      if (profile) {
        setUser(profile);
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
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    const updated = await authApi.updateProfile(profileData);
    if (updated) {
      setUser(updated);
    }
    return updated;
  };

  const isAuthenticated = Boolean(session && user);
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'super_admin'));
  const isSuperAdmin = Boolean(user && user.role === 'super_admin');

  const value = {
    user,
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
