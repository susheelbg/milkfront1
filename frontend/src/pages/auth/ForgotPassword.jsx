import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Logo } from '../../components';
import { authApi } from '../../services/api/authApi';
import { toastService } from '../../services/toastService';
import { Check, KeyRound, ArrowRight, Smartphone, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1); // 1: Access PIN & Phone, 2: New Password, 3: Success
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    accessPin: '',
  });
  const [errors, setErrors] = useState({});

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when editing field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const getCleanedPhone = () => {
    const cleaned = formData.phone.replace(/[^0-9]/g, '');
    return cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    const cleaned = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      errs.phone = t('register.phoneRequired') || 'Mobile number is required';
    } else if (cleaned.length !== 10) {
      errs.phone = t('forgotPassword.invalidPhone') || 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.accessPin.trim()) {
      errs.accessPin = 'Access PIN is required';
    } else if (formData.accessPin !== '4512') {
      errs.accessPin = 'Incorrect Access PIN. Contact admin.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation: Passwords
  const validateStep2 = () => {
    const errs = {};
    if (!formData.password) {
      errs.password = t('login.passwordRequired') || 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = t('forgotPassword.passwordMin') || 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = t('forgotPassword.passwordsMismatch') || 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1 Submit: Check PIN and Phone
  const handleProceedToPassword = async (e) => {
    e.preventDefault();
    if (!validateStep1()) {
      if (formData.accessPin && formData.accessPin !== '4512') {
        toastService.error('Incorrect Access PIN. Contact admin.');
      }
      return;
    }
    setStep(2);
  };

  // Step 2 Submit: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const formattedPhone = getCleanedPhone();
      await authApi.resetPassword(formattedPhone, formData.password, formData.accessPin);
      toastService.success(t('forgotPassword.successTitle') || 'Password reset successful!');
      setStep(3);
    } catch (err) {
      toastService.error(err.message || 'Failed to reset password. Check phone or PIN.');
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
          <p className="text-text-light text-sm font-medium">{t('common.tagline') || "Your Farmer's Dairy Platform"}</p>
        </div>

        {/* Card */}
        <Card className="animate-slide-up" padding="lg">
          {step === 1 && (
            <form onSubmit={handleProceedToPassword} className="space-y-4">
              <h3 className="text-2xl font-bold text-text-dark text-center">
                {t('forgotPassword.title')}
              </h3>
              <p className="text-sm text-text-light text-center">
                {t('forgotPassword.subtitle')}
              </p>
              <p className="text-text-light text-xs font-bold text-center mt-1">Contact admin.</p>

              <Input
                label="Access PIN"
                placeholder="••••"
                type="password"
                name="accessPin"
                value={formData.accessPin}
                onChange={handleChange}
                error={errors.accessPin}
                required
                maxLength={6}
                disabled={loading}
                className="text-center text-2xl tracking-widest font-mono font-bold"
              />

              <Input
                label={t('forgotPassword.phoneLabel')}
                placeholder="9876543210"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                type="tel"
                disabled={loading}
                icon={<Smartphone size={18} />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                <span>{loading ? t('common.loading') : 'Continue'}</span>
                <ArrowRight size={18} />
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-bold text-text-light hover:text-text-dark underline transition-colors"
                  disabled={loading}
                >
                  {t('common.back') || 'Back'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <h3 className="text-2xl font-bold text-text-dark mb-2 text-center">
                {t('forgotPassword.newPasswordTitle')}
              </h3>
              <p className="text-sm text-text-light text-center mb-6">
                {t('forgotPassword.newPasswordSubtitle')}
              </p>

              <div className="relative">
                <Input
                  label={t('common.password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('forgotPassword.newPasswordPlaceholder')}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  disabled={loading}
                  icon={<Lock size={18} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-text-light hover:text-text-dark transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label={t('register.confirmPassword') || 'Confirm Password'}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                  disabled={loading}
                  icon={<KeyRound size={18} />}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-text-light hover:text-text-dark transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('forgotPassword.resetButton')}
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-emerald-200">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold text-text-dark mb-3">
                {t('forgotPassword.successTitle')}
              </h3>
              <p className="text-sm text-text-light mb-8 font-medium">
                {t('register.redirectingLogin') || 'Redirecting to login page in a few seconds...'}
              </p>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                {t('forgotPassword.backToLogin')}
              </Button>

              {/* Automatic Redirect */}
              {useEffect(() => {
                const timeout = setTimeout(() => {
                  navigate('/login');
                }, 4000);
                return () => clearTimeout(timeout);
              }, [])}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
