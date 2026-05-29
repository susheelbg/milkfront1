// Simple authentication service using localStorage
// In production, this would connect to a real backend

const DEMO_USER = {
  phone: '+919876543210',
  password: 'demo123',
};

export const authService = {
  login: (phone, password) => {
    // Simulate API call with delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (phone === DEMO_USER.phone && password === DEMO_USER.password) {
          const userData = {
            phone,
            name: 'Farmer Demo',
            email: 'farmer@milkmaatu.com',
          };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('authToken', 'demo_token_' + Date.now());
          resolve(userData);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },
};
