import { apiClient } from './apiClient';

/**
 * deviceApi — calls FastAPI /api/devices/* endpoints for FCM token management.
 *
 * Stage 1: Registration and deactivation only. No push sending here.
 *
 * Flow:
 *   registerDevice()   → POST /api/devices/register   → Supabase user_devices upsert
 *   deactivateDevice() → POST /api/devices/deactivate → sets is_active = false on logout
 */
export const deviceApi = {
  /**
   * Register (or update) an FCM device token for the currently authenticated user.
   *
   * The FastAPI backend:
   *   1. Verifies the Supabase JWT from the Authorization header.
   *   2. Extracts user_id from the JWT — never trusts client-provided user_id.
   *   3. Performs a PostgreSQL INSERT … ON CONFLICT (device_token) DO UPDATE.
   *      This means:
   *        - First registration → inserts a new row.
   *        - Same token, same user → updates last_seen_at / updated_at.
   *        - Same token, different user → reassigns the token to the new user.
   *
   * Safe to call on every login / app open.
   *
   * @param {string} deviceToken  FCM registration token from Firebase
   * @param {string} platform     'android' | 'ios' | 'web'
   */
  registerDevice: async (deviceToken, platform = 'android') => {
    const res = await apiClient.post('/devices/register', {
      device_token: deviceToken,
      platform,
    });
    return res?.data || null;
  },

  /**
   * Deactivate a device token on user logout.
   *
   * Uses POST with a JSON body (not a DELETE path param) to avoid URL-encoding
   * issues with FCM tokens that may contain special characters.
   *
   * Returns gracefully even if the token is not found (idempotent logout).
   * Must be called BEFORE supabase.auth.signOut() so the JWT is still valid.
   *
   * @param {string} deviceToken  FCM token to deactivate
   */
  deactivateDevice: async (deviceToken) => {
    try {
      const res = await apiClient.post('/devices/deactivate', {
        device_token: deviceToken,
      });
      return res || null;
    } catch (err) {
      // Non-fatal: logout must proceed even if deactivation fails
      console.warn('[deviceApi] deactivateDevice error (non-fatal, logout continues):', err?.message);
      return null;
    }
  },
};
