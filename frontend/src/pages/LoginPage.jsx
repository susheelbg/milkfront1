import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Normalize number
      let cleanedPhone = formData.phone.trim();
      if (cleanedPhone.length === 10 && !cleanedPhone.startsWith('+')) {
        cleanedPhone = `+91${cleanedPhone}`;
      }
      
      const user = await authApi.login(cleanedPhone, formData.password);
      toastService.success(`Welcome back, ${user.name}!`);
      navigate('/home');
    } catch (error) {
      toastService.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold text-text-dark mb-2">🥛</h1>
          <h2 className="text-4xl font-bold text-text-dark mb-2">MilkMaatu</h2>
          <p className="text-text-light text-sm font-medium">Your Farmer's Dairy Platform</p>
        </div>

        {/* Login Card */}
        <Card className="animate-slide-up" padding="lg">
          <form onSubmit={handleSubmit}>
            <h3 className="text-2xl font-bold text-text-dark mb-6 text-center">Welcome Back</h3>

            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mb-4"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="border-t border-border-light pt-4 text-center">
              <p className="text-sm text-text-light">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-bold underline text-text-dark hover:opacity-85 transition-opacity"
                >
                  Register here
                </button>
              </p>
            </div>

            <div className="mt-6 text-center text-xs text-text-light bg-bg-light p-3 rounded-lg border border-border-light">
              <p className="font-bold mb-1">Demo Credentials:</p>
              <p>Phone: +919876543210</p>
              <p>Password: demo123</p>
            </div>
          </form>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-text-light text-xs font-semibold">
          <p>Secure login with OTP verified phone numbers</p>
        </div>
      </div>
    </div>
  );
};

