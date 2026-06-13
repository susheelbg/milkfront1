import { apiClient } from './apiClient';

export const authApi = {
  // Login standard endpoint
  login: async (phone, password) => {
    const res = await apiClient.post('/auth/login', { phone_number: phone, password: password });
    if (res.success && res.data) {
      const sessionUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('authToken', res.data.token.access_token);
      return sessionUser;
    }
    throw new Error(res.message || 'Login failed');
  },

  // WhatsApp OTP Send simulation
  sendOtp: async (phone) => {
    return await apiClient.post('/auth/send-otp', { phone });
  },

  // WhatsApp OTP Verification simulation
  verifyOtp: async (phone, otp) => {
    return await apiClient.post('/auth/verify-otp', { phone, otp });
  },

  // Register endpoint
  register: async (registerData) => {
    return await apiClient.post('/auth/register', registerData);
  },

  // Get currently logged-in user profile
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Update profile details
  updateProfile: async (profileData) => {
    const res = await apiClient.put('/profile', profileData);
    if (res.success && res.data) {
      const sessionUser = res.data;
      localStorage.setItem('user', JSON.stringify(sessionUser));
      return sessionUser;
    }
    throw new Error(res.message || 'Profile update failed');
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  },

  // Forgot Password: Request OTP
  requestForgotPasswordOtp: async (phone) => {
    return await apiClient.post('/auth/forgot-password/request-otp', { phone });
  },

  // Forgot Password: Verify OTP
  verifyForgotPasswordOtp: async (phone, otp) => {
    return await apiClient.post('/auth/forgot-password/verify-otp', { phone, otp });
  },

  // Forgot Password: Reset Password
  resetPassword: async (phone, password, access_pin) => {
    return await apiClient.post('/auth/forgot-password/reset', { phone, password, access_pin });
  },

  // Account Deletion: play store compliance
  deleteAccount: async (password) => {
    return await apiClient.delete('/profile/delete-account', {
      body: JSON.stringify({ password })
    });
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};
