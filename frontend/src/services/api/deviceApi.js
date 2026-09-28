import { apiClient } from './apiClient';

/**
 * deviceApi — calls FastAPI /api/devices/* endpoints for FCM token management.
 * Stage 1: registration and deactivation only. No push sending here.
 */
export const deviceApi = {
  /**
   * Register (or update) an FCM device token with the authenticated user.
   * Backend upserts the token — safe to call on every app open.
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
   * Deactivate a device token on logout.
   * Returns gracefully even if the token is not found (idempotent).
   *
   * @param {string} deviceToken  FCM token to deactivate
   */
  deactivateDevice: async (deviceToken) => {
    try {
      const encodedToken = encodeURIComponent(deviceToken);
      const res = await apiClient.delete(`/devices/${encodedToken}`);
      return res || null;
    } catch (err) {
      // Non-fatal: logout should still proceed even if deactivation fails
      console.warn('[deviceApi] deactivateDevice error (non-fatal):', err);
      return null;
    }
  },
};
