import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { authApi } from '../services/api/authApi';
import { initFCM, deregisterFCM } from '../services/fcmService';

const AuthContext = createContext(null);
const PASSWORD_RECOVERY_KEY = 'milkmaatu_password_recovery';

const getRecoveryUrlState = () => {
  const isResetRoute = window.location.pathname === '/reset-password';
  const params = [
    new URLSearchParams(window.location.search),
    new URLSearchParams(window.location.hash.replace(/^#/, '')),
  ];
  const hasError = params.some((entry) =>
    ['error', 'error_code', 'error_description'].some((key) => entry.has(key))
  );
  const hasRecoveryIntent = params.some((entry) => {
    const hasRecoveryCredential = entry.has('code') || entry.has('token_hash') || entry.has('access_token');
    return hasRecoveryCredential && (!entry.has('type') || entry.get('type') === 'recovery');
  });

  return { isResetRoute, hasError, hasRecoveryIntent };
};

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
  const [recoveryStatus, setRecoveryStatus] = useState(() => {
    const { isResetRoute, hasError, hasRecoveryIntent } = getRecoveryUrlState();
    const storedRecovery = sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === 'active';
    return isResetRoute || hasError || hasRecoveryIntent || storedRecovery ? 'checking' : 'idle';
  });
  const recoveryEventSeen = useRef(false);

  // Load and refresh user profile from backend
  const fetchProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      if (profile) {
        setUser(profile);
        const currentLocalLang = localStorage.getItem('appLanguage') || 'kn';
        if (profile.preferred_language && profile.preferred_language !== currentLocalLang) {
          localStorage.setItem('appLanguage', profile.preferred_language);
        } else if (!profile.preferred_language || profile.preferred_language !== currentLocalLang) {
          authApi.updateProfile({ preferred_language: currentLocalLang }).catch(() => {});
        }
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
        const { isResetRoute, hasError, hasRecoveryIntent } = getRecoveryUrlState();
        const storedRecovery = sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === 'active';
        const isRecoverySession = Boolean(initialSession && (storedRecovery || hasRecoveryIntent));

        if (!recoveryEventSeen.current) {
          if (isRecoverySession) {
            recoveryEventSeen.current = true;
            sessionStorage.setItem(PASSWORD_RECOVERY_KEY, 'active');
            setRecoveryStatus('active');
          } else if (isResetRoute || hasError || hasRecoveryIntent || storedRecovery) {
            sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
            setRecoveryStatus('invalid');
          }
        }

        if (initialSession) {
          if (!isRecoverySession) {
            await fetchProfile();
            // Initialise FCM after session is confirmed (non-blocking)
            initFCM().catch((e) => console.warn('[AuthContext] FCM init error:', e));
          }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      const { hasRecoveryIntent } = getRecoveryUrlState();
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && hasRecoveryIntent)) {
        recoveryEventSeen.current = true;
        sessionStorage.setItem(PASSWORD_RECOVERY_KEY, 'active');
        setRecoveryStatus('active');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession && !recoveryEventSeen.current) {
          Promise.resolve().then(fetchProfile).then(() => {
            initFCM().catch((e) => console.warn('[AuthContext] FCM init error:', e));
          });
        }
      } else if (event === 'SIGNED_OUT') {
        recoveryEventSeen.current = false;
        setUser(null);
        localStorage.removeItem('milkmaatu_auth_user');
        sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
        setRecoveryStatus((current) => current === 'completed' ? current : 'idle');
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
      // Deregister FCM token before signing out so the backend still has auth
      await deregisterFCM();
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

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await deregisterFCM().catch(() => {});
      await authApi.deleteAccount();
      setUser(null);
      setSession(null);
      localStorage.removeItem('milkmaatu_auth_user');
      localStorage.removeItem('active_cart');
      localStorage.removeItem('my_cattle_listings');
    } finally {
      setLoading(false);
    }
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
    deleteAccount,
    refreshProfile: fetchProfile,
    recoveryStatus,
    clearPasswordRecovery: () => {
      sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
      setRecoveryStatus('completed');
    },
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
