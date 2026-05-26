import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components';
import { authService } from '../services/authService';
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
      await authService.login(formData.phone, formData.password);
      toastService.success('Login successful!');
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
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold text-text-dark mb-2">🥛</h1>
          <h2 className="text-4xl font-bold text-text-dark mb-2">MilkMaatu</h2>
          <p className="text-text-light">Your Farmer's Dairy Platform</p>
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

            <div className="text-center text-sm text-text-light">
              <p className="mb-2">Demo Credentials:</p>
              <p>Phone: +919876543210</p>
              <p>Password: demo123</p>
            </div>
          </form>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-text-light text-sm">
          <p>Secure login with phone number and password</p>
        </div>
      </div>
    </div>
  );
};
