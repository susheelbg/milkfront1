// Farmer profile & Local Preferences helper
// MilkMaatu operates without mandatory user login or registration.
// Farmer contact details (name, phone, village, address) are stored in localStorage for convenient pre-filling.

export const authApi = {
  // Get farmer profile from local storage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('farmer_profile');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Save/update farmer profile details locally
  updateProfile: async (profileData) => {
    try {
      const current = authApi.getCurrentUser() || {};
      const updated = {
        ...current,
        ...profileData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('farmer_profile', JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to update farmer profile:', e);
      throw new Error('Failed to save profile details');
    }
  },

  getProfile: async () => {
    return authApi.getCurrentUser();
  },

  saveProfile: (profileData) => {
    return authApi.updateProfile(profileData);
  },

  // Reset local farmer details if requested
  clearProfile: () => {
    localStorage.removeItem('farmer_profile');
  },

  // Legacy compatibility helpers
  logout: () => {
    localStorage.removeItem('farmer_profile');
    localStorage.removeItem('admin_session');
  },

  isAuthenticated: () => {
    // Application is public for all farmers
    return true;
  },

  // Admin access helpers
  isAdminAuthenticated: () => {
    return localStorage.getItem('admin_session') === 'active';
  },

  adminLogin: (pin) => {
    // Validated against ACCESS_PIN (4512)
    if (pin === '4512') {
      localStorage.setItem('admin_session', 'active');
      return true;
    }
    return false;
  },

  adminLogout: () => {
    localStorage.removeItem('admin_session');
  },
};
