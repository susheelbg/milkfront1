import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Logo } from '../../components';
import { authApi } from '../../services/api/authApi';
import { toastService } from '../../services/toastService';
import { Check, ShieldCheck, KeyRound, ArrowRight, Smartphone, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [step, setStep] = useState(1); // 1: Mobile Number, 2: OTP, 3: New Password, 4: Success
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  // Countdown for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCleanedPhone = () => {
    const cleaned = formData.phone.replace(/[^0-9]/g, '');
    return cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
  };

  // Step 1 Validation: Mobile Number
  const validateStep1 = () => {
    const errs = {};
    const cleaned = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      errs.phone = t('register.phoneRequired') || 'Mobile number is required';
    } else if (cleaned.length !== 10) {
      errs.phone = t('forgotPassword.invalidPhone') || 'Please enter a valid 10-digit mobile number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation: OTP
  const validateStep2 = () => {
    const errs = {};
    if (!formData.otp.trim()) {
      errs.otp = t('register.otpRequired') || 'OTP is required';
    } else if (formData.otp.length !== 4) {
      errs.otp = t('register.otpDigits') || 'OTP must be 4 digits';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 3 Validation: Passwords
  const validateStep3 = () => {
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

  // Step 1 Submit: Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const formattedPhone = getCleanedPhone();
      await authApi.requestForgotPasswordOtp(formattedPhone);
      toastService.success(t('register.otpSentToast') || 'Mock OTP sent to WhatsApp! Use code 1234');
      setStep(2);
      setCountdown(30); // 30 seconds cooldown
    } catch (err) {
      toastService.error(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const formattedPhone = getCleanedPhone();
      await authApi.requestForgotPasswordOtp(formattedPhone);
      toastService.success(t('register.otpSentToast') || 'Mock OTP resent to WhatsApp! Use code 1234');
      setCountdown(30);
    } catch (err) {
      toastService.error(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const formattedPhone = getCleanedPhone();
      await authApi.verifyForgotPasswordOtp(formattedPhone, formData.otp);
      toastService.success(t('register.otpVerifiedToast') || 'OTP verified successfully!');
      setStep(3);
    } catch (err) {
      toastService.error(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submit: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const formattedPhone = getCleanedPhone();
      await authApi.resetPassword(formattedPhone, formData.password);
      toastService.success(t('forgotPassword.successTitle') || 'Password reset successful!');
      setStep(4);
    } catch (err) {
      toastService.error(err.message || 'Failed to reset password.');
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

        {/* Step Cards */}
        <Card className="animate-slide-up" padding="lg">
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <h3 className="text-2xl font-bold text-text-dark mb-2 text-center">
                {t('forgotPassword.title')}
              </h3>
              <p className="text-sm text-text-light text-center mb-6">
                {t('forgotPassword.subtitle')}
              </p>

              <Input
                label={t('forgotPassword.phoneLabel')}
                placeholder="9876543210"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                type="tel"
                icon={<Smartphone size={18} />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4 flex items-center justify-center gap-2"
                disabled={loading}
              >
                <span>{loading ? t('common.loading') : t('forgotPassword.sendOtpButton')}</span>
                <ArrowRight size={18} />
              </Button>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm font-bold text-text-light hover:text-text-dark underline transition-colors"
                >
                  {t('common.back') || 'Back'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <h3 className="text-2xl font-bold text-text-dark mb-2 text-center">
                {t('forgotPassword.otpTitle')}
              </h3>
              <p className="text-sm text-text-light text-center mb-6">
                {t('forgotPassword.otpSubtitle').replace('{phone}', getCleanedPhone())}
              </p>

              <Input
                label="OTP"
                placeholder="1234"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                error={errors.otp}
                required
                maxLength={4}
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                icon={<ShieldCheck size={18} />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('forgotPassword.verifyOtpButton')}
              </Button>

              <div className="mt-4 flex items-center justify-between text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-text-light hover:text-text-dark underline transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  className={`underline transition-colors ${
                    countdown > 0 ? 'text-text-light/50 cursor-not-allowed' : 'text-text-light hover:text-text-dark'
                  }`}
                >
                  {countdown > 0
                    ? `${t('forgotPassword.resendOtpButton')} (${countdown}s)`
                    : t('forgotPassword.resendOtpButton')}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <h3 className="text-2xl font-bold text-text-dark mb-2 text-center">
                {t('forgotPassword.newPasswordTitle')}
              </h3>
              <p className="text-sm text-text-light text-center mb-6">
                {t('forgotPassword.newPasswordSubtitle')}
              </p>

              <Input
                label={t('common.password')}
                type="password"
                placeholder={t('forgotPassword.newPasswordPlaceholder')}
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                icon={<Lock size={18} />}
              />

              <Input
                label={t('register.confirmPassword') || 'Confirm Password'}
                type="password"
                placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                icon={<KeyRound size={18} />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('forgotPassword.resetButton')}
              </Button>
            </form>
          )}

          {step === 4 && (
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
