import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Logo } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in flex flex-col items-center">
          <Logo
            imgClassName="h-24 w-auto mb-3 drop-shadow-md"
            fallbackClassName="text-4xl font-black mb-3"
            alt="MilkMaatu Logo"
          />
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
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            {/* Show Password Toggle Checkbox */}
            <div className="flex items-center gap-2 mb-6 -mt-2">
              <input
                type="checkbox"
                id="show-password"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="show-password"
                className="text-xs font-bold text-text-light hover:text-text-dark cursor-pointer select-none transition-colors"
              >
                Show Password
              </label>
            </div>

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

