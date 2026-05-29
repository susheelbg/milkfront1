import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { Check, ShieldCheck, KeyRound, UserPlus, ArrowRight, Smartphone } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Info/Phone, 2: OTP, 3: Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    otp: '',
    password: '',
    confirmPassword: '',
    address: '',
    villageName: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Step 1 validation
  const validateStep1 = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    
    if (!formData.phone.trim()) {
      errs.phone = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[^0-9]/g, '').slice(-10))) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs = {};
    if (!formData.otp.trim()) {
      errs.otp = 'OTP is required';
    } else if (formData.otp.length !== 4) {
      errs.otp = 'OTP must be 4 digits';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 validation
  const validateStep3 = () => {
    const errs = {};
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1: Send OTP and proceed
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    try {
      // Normalize phone number (ensure +91 prefix)
      const cleanedPhone = formData.phone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanedPhone.length === 10 ? `+91${cleanedPhone}` : `+${cleanedPhone}`;
      
      await authApi.sendOtp(formattedPhone);
      toastService.success('Mock OTP sent to WhatsApp! Use code 1234');
      setStep(2);
    } catch (err) {
      toastService.error(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const cleanedPhone = formData.phone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanedPhone.length === 10 ? `+91${cleanedPhone}` : `+${cleanedPhone}`;

      await authApi.verifyOtp(formattedPhone, formData.otp);
      toastService.success('OTP Verified!');
      setStep(3);
    } catch (err) {
      toastService.error(err.message || 'Verification failed. Try 1234');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Register
  const handleRegisterComplete = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const cleanedPhone = formData.phone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanedPhone.length === 10 ? `+91${cleanedPhone}` : `+${cleanedPhone}`;

      await authApi.register({
        name: formData.name,
        phone: formattedPhone,
        password: formData.password,
        address: formData.address,
        villageName: formData.villageName,
      });

      toastService.success('Account created successfully!');
      setStep(4);
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      toastService.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-text-dark mb-1">🥛 MilkMaatu</h1>
          <p className="text-text-light text-sm">Create your cattle farmer account</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-4">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  step >= s
                    ? 'bg-text-dark text-white border-text-dark'
                    : 'bg-white text-text-light border-border-light'
                }`}
              >
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                    step > s ? 'bg-text-dark' : 'bg-white'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="animate-slide-up" padding="lg">
          {/* STEP 1: Name and Phone */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-4">
                <UserPlus className="w-12 h-12 mx-auto text-primary mb-2" />
                <h3 className="text-xl font-bold text-text-dark">Farmer Information</h3>
                <p className="text-text-light text-xs">Enter your details to receive an OTP</p>
              </div>

              <Input
                label="Full Name"
                placeholder="e.g. Susheel Kumar"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              <Input
                label="Mobile Number"
                placeholder="10-digit number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send WhatsApp OTP'}
                <ArrowRight size={18} />
              </Button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <Smartphone className="w-12 h-12 mx-auto text-primary mb-2" />
                <h3 className="text-xl font-bold text-text-dark">WhatsApp Verification</h3>
                <p className="text-text-light text-xs">We sent a mock verification code to WhatsApp</p>
              </div>

              <Input
                label="Verification Code (OTP)"
                placeholder="Enter 4-digit code (e.g. 1234)"
                type="text"
                maxLength={4}
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                error={errors.otp}
                required
                className="text-center text-2xl tracking-widest"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
                <ShieldCheck size={18} />
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-text-light hover:text-text-dark mt-2 font-medium"
              >
                ← Back to edit phone number
              </button>
            </form>
          )}

          {/* STEP 3: Setup Password */}
          {step === 3 && (
            <form onSubmit={handleRegisterComplete} className="space-y-4">
              <div className="text-center mb-4">
                <KeyRound className="w-12 h-12 mx-auto text-primary mb-2" />
                <h3 className="text-xl font-bold text-text-dark">Secure Password</h3>
                <p className="text-text-light text-xs">Choose a secure password and optional details</p>
              </div>

              <Input
                label="Password"
                placeholder="At least 6 characters"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={errors.confirmPassword ? errors.confirmPassword : ''}
                error={errors.confirmPassword}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Village (Optional)"
                  placeholder="e.g. Thendekere"
                  name="villageName"
                  value={formData.villageName}
                  onChange={handleChange}
                />
                <Input
                  label="Address (Optional)"
                  placeholder="e.g. Road 4"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Finishing Registration...' : 'Complete Register'}
                <Check size={18} />
              </Button>
            </form>
          )}

          {/* STEP 4: Registration Success */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-text-dark">Account Created!</h3>
              <p className="text-text-light text-sm">
                Congratulations, {formData.name}! Your farmer account is ready.
              </p>
              <div className="bg-primary-light text-text-dark text-xs p-3 rounded-lg">
                Redirecting you to the Login screen in a few seconds...
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Go to Login Now
              </Button>
            </div>
          )}
        </Card>

        {/* Back Link */}
        {step < 4 && (
          <div className="text-center mt-6">
            <p className="text-text-dark text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-bold underline text-text-dark hover:opacity-80 transition-opacity"
              >
                Login here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
