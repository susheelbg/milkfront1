/**
 * fcmService.js
 *
 * Capacitor-based FCM device token registration for Android/iOS.
 *
 * Stage 1 responsibilities:
 *   - Detect if running on native Capacitor (Android/iOS) vs. web
 *   - Request notification permission (Android 13+ POST_NOTIFICATIONS compatible)
 *   - Register with Firebase via the Capacitor PushNotifications plugin
 *   - Retrieve the FCM device token
 *   - Report the correct platform ('android' | 'ios' | 'web')
 *   - Send the token to the FastAPI backend (POST /api/devices/register)
 *   - Handle token refresh events automatically
 *   - Deregister token cleanly on logout
 *
 * This module does NOT:
 *   - Send push messages (that is Stage 2)
 *   - Use any Firebase server credentials or service-account keys
 *   - Touch Web Push / VAPID / browser-based push notifications
 *
 * Environment variables required:
 *   VITE_API_URL  — FastAPI base URL, e.g. https://milkfront1.onrender.com/api
 *
 * No Firebase client-side env variables are needed — FCM initialises
 * automatically on Android via google-services.json which is embedded in the
 * compiled APK at build time.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { deviceApi } from './api/deviceApi';

// ─── Platform detection ────────────────────────────────────────────────────────

const IS_NATIVE = Capacitor.isNativePlatform();

/**
 * Returns 'android', 'ios', or 'web' based on the current runtime environment.
 * Used to store the correct platform value in public.user_devices.
 */
const getPlatform = () => {
  if (!IS_NATIVE) return 'web';
  const p = Capacitor.getPlatform(); // 'android' | 'ios'
  return p === 'ios' ? 'ios' : 'android';
};

// ─── In-memory / persisted token state ────────────────────────────────────────

/** In-memory token — set as soon as Firebase fires the registration event. */
let _currentToken = null;

/**
 * Guard to prevent calling PushNotifications.register() multiple times in the
 * same app session. Firebase/Capacitor handles token refresh internally via the
 * 'registration' listener; we only need to call register() once per session.
 */
let _fcmInitialized = false;

/**
 * Guard to prevent adding duplicate Capacitor event listeners.
 * Listeners are module-level singletons.
 */
let _listenersRegistered = false;

// ─── localStorage helpers ──────────────────────────────────────────────────────

const TOKEN_STORAGE_KEY = 'milkmaatu_fcm_token';

const getPersistedToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const persistToken = (token) => {
  _currentToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage quota error — non-fatal
  }
};

// ─── Capacitor listener registration ──────────────────────────────────────────

/**
 * Register Capacitor PushNotification event listeners.
 * This is called once per module lifetime — idempotent via _listenersRegistered.
 */
const registerListeners = async () => {
  if (_listenersRegistered) return;
  _listenersRegistered = true;

  /**
   * 'registration' fires:
   *   (a) after the first PushNotifications.register() call, and
   *   (b) automatically whenever Firebase rotates/refreshes the token.
   * Both cases are handled identically — upsert into user_devices.
   */
  await PushNotifications.addListener('registration', async (token) => {
    const fcmToken = token.value;
    if (!fcmToken) {
      console.warn('[FCM] Received empty token — skipping registration');
      return;
    }

    if (import.meta.env.DEV) {
      // Log only token length — never log the full token to the console in dev
      console.log('[FCM] Token received, length:', fcmToken.length, '| platform:', getPlatform());
    }

    persistToken(fcmToken);

    // POST to FastAPI → Supabase upsert (ON CONFLICT DO UPDATE)
    try {
      await deviceApi.registerDevice(fcmToken, getPlatform());
      if (import.meta.env.DEV) {
        console.log('[FCM] Token successfully registered with backend (user_devices upserted)');
      }
    } catch (err) {
      // Non-fatal: the app continues to work without push notifications
      console.warn('[FCM] Backend token registration failed (non-fatal):', err?.message);
    }
  });

  /** Firebase registration error — log and continue; never crash the app. */
  await PushNotifications.addListener('registrationError', (err) => {
    console.warn('[FCM] Firebase registration error (non-fatal):', err);
  });

  /**
   * Foreground notification received.
   * Stage 2 will update the in-app notification bell count here.
   */
  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    if (import.meta.env.DEV) {
      console.log('[FCM] Foreground notification received:', notification.title);
    }
    // Stage 2: dispatch event or call notificationApi.getUnreadCount() here
  });

  /**
   * User tapped a notification.
   * Stage 2 will implement deep-link routing here.
   */
  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    if (import.meta.env.DEV) {
      console.log('[FCM] Notification tapped:', action.actionId, action.notification?.data);
    }
    // Stage 2: navigate to relevant screen based on action.notification.data
  });
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Request OS notification permission.
 *
 * On Android 13+ this presents the POST_NOTIFICATIONS system dialog.
 * On older Android, permission is granted implicitly.
 * On iOS, this presents the standard notification permission dialog.
 *
 * Returns:
 *   'granted'                — permission allowed
 *   'denied'                 — user denied; do NOT prompt again
 *   'prompt'                 — not yet asked (first time)
 *   'prompt-with-rationale'  — Android rationale case
 *   'web'                    — not on native; FCM skipped silently
 */
export const requestNotificationPermission = async () => {
  if (!IS_NATIVE) return 'web';

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'granted') {
      // Already granted — no dialog needed
      return 'granted';
    }

    if (permStatus.receive === 'denied') {
      // User explicitly denied — respect it, do not re-prompt
      return 'denied';
    }

    // 'prompt' or 'prompt-with-rationale' — ask the user
    permStatus = await PushNotifications.requestPermissions();
    return permStatus.receive;
  } catch (err) {
    console.warn('[FCM] Permission check error (non-fatal):', err?.message);
    return 'denied';
  }
};

/**
 * Initialise FCM token registration for the current authenticated session.
 *
 * Safe to call multiple times (idempotent):
 *   - Listeners are only registered once per module lifetime.
 *   - PushNotifications.register() is only called once per app session.
 *   - Subsequent calls are no-ops (token refresh is handled by the listener).
 *
 * Call this after a confirmed Supabase session (login, session restore, or
 * TOKEN_REFRESHED event).
 */
export const initFCM = async () => {
  if (!IS_NATIVE) {
    if (import.meta.env.DEV) {
      console.log('[FCM] Web platform — FCM registration skipped (Android/iOS only)');
    }
    return;
  }

  try {
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      if (import.meta.env.DEV) {
        console.info('[FCM] Notification permission not granted:', permission, '— app continues normally');
      }
      return; // App works normally without push notifications
    }

    // Register listeners (idempotent — only runs once)
    await registerListeners();

    // Create default notification channel with high importance on Android 8+
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'default',
          name: 'General Notifications',
          description: 'MilkMaatu app notifications',
          importance: 5, // High importance (heads-up popup & sound)
          visibility: 1, // Public on lockscreen
          vibration: true,
        });
      } catch (err) {
        console.warn('[FCM] Channel creation error (non-fatal):', err?.message);
      }
    }

    // If we already have a cached token from a previous session or register event,
    // ensure backend is updated immediately so is_active=true on re-login
    const existingToken = getCurrentFCMToken();
    if (existingToken) {
      try {
        await deviceApi.registerDevice(existingToken, getPlatform());
        if (import.meta.env.DEV) {
          console.log('[FCM] Existing token reactivated with backend on login');
        }
      } catch (err) {
        console.warn('[FCM] Re-activation of existing token failed (non-fatal):', err?.message);
      }
    }

    if (_fcmInitialized) {
      if (import.meta.env.DEV) {
        console.log('[FCM] Already initialized this session — token refresh handled by listener');
      }
      return;
    }

    // Trigger Firebase SDK registration
    // This fires the 'registration' listener asynchronously when Firebase generates/refreshes token
    await PushNotifications.register();
    _fcmInitialized = true;

    if (import.meta.env.DEV) {
      console.log('[FCM] PushNotifications.register() called — awaiting token from Firebase...');
    }
  } catch (err) {
    // FCM init failure must NEVER crash or block the app
    console.warn('[FCM] initFCM error (non-fatal, app continues):', err?.message);
  }
};

/**
 * Deactivate the current device's FCM token on logout.
 *
 * Must be called BEFORE Supabase signOut — the backend needs a valid JWT
 * to authenticate the deactivation request.
 *
 * On success:
 *   - Sets is_active = false in public.user_devices (row is KEPT, not deleted).
 *   - Resets _fcmInitialized so next login calls PushNotifications.register() again.
 *   - The FCM token is intentionally kept in localStorage so that:
 *       (a) on re-login, the same token is found and the existing row is
 *           re-activated (is_active = true) via the upsert — no duplicate row.
 *       (b) if Firebase returns a refreshed token, the upsert handles it cleanly.
 *
 * On failure: silently continues — logout always proceeds regardless.
 */
export const deregisterFCM = async () => {
  if (!IS_NATIVE) return;

  const token = _currentToken || getPersistedToken();
  if (!token) {
    if (import.meta.env.DEV) {
      console.log('[FCM] No active token to deregister');
    }
    return;
  }

  try {
    await deviceApi.deactivateDevice(token);

    // ─── IMPORTANT ───────────────────────────────────────────────────────────
    // Do NOT clear localStorage here.
    // The token is retained so that on the next login, initFCM will call
    // PushNotifications.register() → Firebase returns the same token →
    // the backend upsert sets is_active = true on the EXISTING row.
    // This ensures the same user_devices row is reused across login/logout
    // cycles with no duplicate rows.
    // ─────────────────────────────────────────────────────────────────────────

    // Reset in-memory init flag so register() is called on next login
    _fcmInitialized = false;
    // Clear in-memory token (it remains in localStorage)
    _currentToken = null;

    if (import.meta.env.DEV) {
      console.log('[FCM] Token deactivated (is_active=false). Row kept in user_devices. Token retained in localStorage for re-login.');
    }
  } catch (err) {
    // Non-fatal — logout must always succeed
    console.warn('[FCM] Deregistration error (non-fatal, logout continues):', err?.message);
  }
};

/**
 * Returns the current FCM token (in-memory or persisted), or null.
 * Useful for debugging or if you need the token elsewhere.
 */
export const getCurrentFCMToken = () => _currentToken || getPersistedToken();
