import { apiClient, mockDelay } from './apiClient';

export const authApi = {
  // Login standard endpoint
  login: async (phone, password) => {
    try {
      return await apiClient.post('/auth/login', { phone, password });
    } catch (err) {
      // Fallback local mock implementation
      await mockDelay();
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.phone === phone && u.password === password);
      
      if (user) {
        const sessionUser = {
          phone: user.phone,
          name: user.name,
          role: user.role || 'farmer',
          address: user.address || '',
          villageName: user.villageName || '',
        };
        localStorage.setItem('user', JSON.stringify(sessionUser));
        localStorage.setItem('authToken', 'jwt_token_mock_' + Date.now());
        return sessionUser;
      }
      throw new Error('Invalid phone number or password. Check demo credentials.');
    }
  },

  // WhatsApp OTP Send simulation
  sendOtp: async (phone) => {
    try {
      return await apiClient.post('/auth/send-otp', { phone });
    } catch (err) {
      await mockDelay();
      // Generate a mock code and alert it / store it locally for verification
      const mockOtp = '1234';
      localStorage.setItem(`mock_otp_${phone}`, mockOtp);
      console.log(`[WHATSAPP OTP SIMULATION] Sent OTP: ${mockOtp} to ${phone}`);
      return { success: true, message: 'OTP sent successfully via WhatsApp' };
    }
  },

  // WhatsApp OTP Verification simulation
  verifyOtp: async (phone, otp) => {
    try {
      return await apiClient.post('/auth/verify-otp', { phone, otp });
    } catch (err) {
      await mockDelay();
      const storedOtp = localStorage.getItem(`mock_otp_${phone}`);
      if (otp === '1234' || otp === storedOtp) {
        return { success: true, message: 'OTP verified' };
      }
      throw new Error('Invalid OTP code. Try entering 1234.');
    }
  },

  // Register endpoint
  register: async (registerData) => {
    try {
      return await apiClient.post('/auth/register', registerData);
    } catch (err) {
      await mockDelay();
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      
      // Check if user already exists
      if (users.some(u => u.phone === registerData.phone)) {
        throw new Error('Phone number is already registered.');
      }

      const newUser = {
        name: registerData.name,
        phone: registerData.phone,
        password: registerData.password,
        role: 'farmer', // default role
        address: registerData.address || '',
        villageName: registerData.villageName || '',
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));
      return { success: true, message: 'Registration successful' };
    }
  },

  // Get currently logged-in user profile
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Update profile details
  updateProfile: async (profileData) => {
    try {
      return await apiClient.put('/auth/profile', profileData);
    } catch (err) {
      await mockDelay();
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const currentUser = authApi.getCurrentUser();
      
      if (!currentUser) throw new Error('User not authenticated');

      const userIndex = users.findIndex(u => u.phone === currentUser.phone);
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          name: profileData.name || users[userIndex].name,
          address: profileData.address || users[userIndex].address,
          villageName: profileData.villageName || users[userIndex].villageName,
        };
        
        const updatedSession = {
          ...currentUser,
          name: profileData.name || currentUser.name,
          address: profileData.address || currentUser.address,
          villageName: profileData.villageName || currentUser.villageName,
        };

        localStorage.setItem('mock_users', JSON.stringify(users));
        localStorage.setItem('user', JSON.stringify(updatedSession));
        return updatedSession;
      }
      throw new Error('User profile not found in database');
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};
