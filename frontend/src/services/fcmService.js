/**
 * fcmService.js
 *
 * Capacitor-based FCM device token registration for Android.
 *
 * Stage 1 responsibilities:
 *   - Check if running on a native Capacitor/Android platform
 *   - Request notification permission (Android 13+ POST_NOTIFICATIONS)
 *   - Register with Firebase via Capacitor PushNotifications plugin
 *   - Retrieve the FCM device token
 *   - Send the token to the FastAPI backend (/api/devices/register)
 *   - Handle token refresh events
 *
 * This module does NOT:
 *   - Send push messages (Stage 2)
 *   - Use any Firebase server credentials
 *   - Touch web-push / VAPID / browser notifications
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { deviceApi } from './api/deviceApi';

const IS_NATIVE = Capacitor.isNativePlatform();

// Store the current token in memory so we can deactivate it on logout
let _currentToken = null;

// Avoid adding duplicate listeners across hot-reloads
let _listenersRegistered = false;

/**
 * Read the persisted FCM token from localStorage (survives app restarts).
 */
const getPersistedToken = () => {
  try {
    return localStorage.getItem('milkmaatu_fcm_token') || null;
  } catch {
    return null;
  }
};

/**
 * Persist the FCM token locally so we can deactivate it on logout
 * even if the token hasn't changed.
 */
const persistToken = (token) => {
  _currentToken = token;
  try {
    if (token) {
      localStorage.setItem('milkmaatu_fcm_token', token);
    } else {
      localStorage.removeItem('milkmaatu_fcm_token');
    }
  } catch {
    // localStorage quota — non-fatal
  }
};

/**
 * Register a single set of Capacitor PushNotification listeners.
 * Called once during initialization; idempotent via _listenersRegistered flag.
 */
const registerListeners = async () => {
  if (_listenersRegistered) return;
  _listenersRegistered = true;

  // Token received (initial registration AND token refresh)
  await PushNotifications.addListener('registration', async (token) => {
    const fcmToken = token.value;
    if (!fcmToken) return;

    if (import.meta.env.DEV) {
      console.log('[FCM] Token received (length):', fcmToken.length);
    }

    persistToken(fcmToken);

    try {
      await deviceApi.registerDevice(fcmToken, 'android');
      if (import.meta.env.DEV) {
        console.log('[FCM] Token registered with backend successfully');
      }
    } catch (err) {
      console.warn('[FCM] Backend token registration failed (non-fatal):', err?.message);
    }
  });

  // Registration error
  await PushNotifications.addListener('registrationError', (err) => {
    console.warn('[FCM] Registration error (non-fatal):', err);
  });

  // Foreground notification received (Stage 2 will handle routing)
  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    if (import.meta.env.DEV) {
      console.log('[FCM] Foreground notification received:', notification.title);
    }
    // Stage 2: refresh in-app notification bell count here
  });

  // Notification tapped by user (Stage 2 will handle deep-linking)
  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    if (import.meta.env.DEV) {
      console.log('[FCM] Notification action performed:', action.actionId);
    }
    // Stage 2: deep-link routing here
  });
};

/**
 * Request notification permission from the OS.
 *
 * Returns:
 *   'granted'  — user allowed notifications
 *   'denied'   — user denied (we should NOT repeatedly prompt)
 *   'prompt'   — will be asked (first time)
 *   'web'      — not on native; skip
 */
export const requestNotificationPermission = async () => {
  if (!IS_NATIVE) return 'web';

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    return permStatus.receive; // 'granted' | 'denied' | 'prompt-with-rationale'
  } catch (err) {
    console.warn('[FCM] Permission check failed (non-fatal):', err?.message);
    return 'denied';
  }
};

/**
 * Initialize FCM: request permission, register listeners, and trigger registration.
 *
 * Call this after a successful Supabase login or session restore.
 * Safe to call multiple times — internally idempotent.
 */
export const initFCM = async () => {
  if (!IS_NATIVE) {
    if (import.meta.env.DEV) {
      console.log('[FCM] Not a native platform — skipping FCM init');
    }
    return;
  }

  try {
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      console.info('[FCM] Notification permission not granted:', permission);
      // App continues working normally — don't block
      return;
    }

    // Register listeners once
    await registerListeners();

    // Trigger Firebase registration (fires 'registration' event asynchronously)
    await PushNotifications.register();

    if (import.meta.env.DEV) {
      console.log('[FCM] PushNotifications.register() called — awaiting token...');
    }
  } catch (err) {
    // FCM failure must NEVER crash the app
    console.warn('[FCM] initFCM error (non-fatal):', err?.message);
  }
};

/**
 * Deactivate the current device token on logout.
 *
 * Call this BEFORE calling Supabase signOut so the backend can still
 * authenticate the request.
 */
export const deregisterFCM = async () => {
  if (!IS_NATIVE) return;

  const token = _currentToken || getPersistedToken();
  if (!token) {
    if (import.meta.env.DEV) {
      console.log('[FCM] No token to deregister');
    }
    return;
  }

  try {
    await deviceApi.deactivateDevice(token);
    persistToken(null);
    if (import.meta.env.DEV) {
      console.log('[FCM] Token deregistered on logout');
    }
  } catch (err) {
    // Non-fatal — logout should proceed regardless
    console.warn('[FCM] Deregistration failed (non-fatal):', err?.message);
  }
};

/**
 * Returns the current in-memory FCM token (or null if not yet registered).
 */
export const getCurrentFCMToken = () => _currentToken || getPersistedToken();
