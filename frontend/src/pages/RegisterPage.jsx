import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Logo } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { Check, KeyRound, UserPlus, ArrowRight, Smartphone, Eye, EyeOff, Lock } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Access PIN, 2: Form/Details, 3: Success
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    villageName: '',
    accessPin: '',
  });
  const [errors, setErrors] = useState({});
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const getCleanedPhone = () => {
    const cleaned = formData.phone.replace(/[^0-9]/g, '');
    return cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
  };

  // Step 1 check (Access PIN)
  const handleVerifyAccessPin = (e) => {
    e.preventDefault();
    if (formData.accessPin !== '4512') {
      setErrors({ accessPin: 'Incorrect Access PIN. Contact admin.' });
      toastService.error('Incorrect Access PIN. Contact admin.');
      return;
    }
    setErrors({});
    setStep(2);
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = t('register.fullNameRequired') || 'Full name is required';
    }
    
    const cleaned = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      errs.phone = t('register.phoneRequired') || 'Mobile number is required';
    } else if (cleaned.length !== 10) {
      errs.phone = t('forgotPassword.invalidPhone') || 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.password) {
      errs.password = t('login.passwordRequired') || 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = t('login.passwordMin') || 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = t('register.passwordMatch') || 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 Submit: Complete Registration
  const handleRegisterComplete = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    if (!agreedTerms || !agreedPrivacy) {
      toastService.error(t('compliance.agreeRequired') || 'You must agree to the Terms and Privacy Policy to continue');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = getCleanedPhone();
      await authApi.register({
        name: formData.name,
        phone: formattedPhone,
        password: formData.password,
        address: formData.address,
        villageName: formData.villageName,
        consent_timestamp: new Date().toISOString(),
        access_pin: formData.accessPin,
      });

      toastService.success(t('register.successToast') || 'Account created successfully!');
      setStep(3);

      // Auto redirect to login after 4 seconds
      setTimeout(() => {
        navigate('/login');
      }, 4000);
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
        <div className="text-center mb-8 animate-fade-in flex flex-col items-center">
          <Logo
            imgClassName="h-20 w-auto mb-2 drop-shadow-md"
            fallbackClassName="text-3xl font-black mb-2"
            alt="MilkMaatu Logo"
          />
          <p className="text-text-light text-sm font-medium">{t('common.tagline') || 'Your Farmer\'s Dairy Platform'}</p>
        </div>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-between mb-6 px-4">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    step >= s
                      ? 'bg-text-dark text-white border-text-dark'
                      : 'bg-white text-text-light border-border-light'
                  }`}
                >
                  {step > s ? <Check size={14} strokeWidth={3} /> : s}
                </div>
                {s < 2 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                      step > s ? 'bg-text-dark' : 'bg-white'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <Card className="animate-slide-up" padding="lg">
          {/* STEP 1: Admin Access PIN */}
          {step === 1 && (
            <form onSubmit={handleVerifyAccessPin} className="space-y-4">
              <div className="text-center mb-4">
                <KeyRound className="w-12 h-12 mx-auto text-primary mb-2" />
                <h3 className="text-xl font-bold text-text-dark">Access PIN</h3>
                <p className="text-text-light text-xs font-bold mt-1">Contact admin.</p>
              </div>

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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                <span>{t('common.submit') || 'Continue'}</span>
                <ArrowRight size={18} />
              </Button>
            </form>
          )}

          {/* STEP 2: Registration details */}
          {step === 2 && (
            <form onSubmit={handleRegisterComplete} className="space-y-4">
              <div className="text-center mb-4">
                <UserPlus className="w-12 h-12 mx-auto text-primary mb-2" />
                <h3 className="text-xl font-bold text-text-dark">{t('register.title')}</h3>
                <p className="text-text-light text-xs">{t('register.subtitle')}</p>
              </div>

              <Input
                label={t('register.fullName')}
                placeholder={t('register.fullNamePlaceholder')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                disabled={loading}
              />

              <Input
                label={t('common.phone')}
                placeholder="9876543210"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                disabled={loading}
                icon={<Smartphone size={18} />}
              />

              <div className="relative">
                <Input
                  label={t('common.password')}
                  placeholder={t('register.passwordPlaceholder')}
                  type={showPassword ? 'text' : 'password'}
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
                  placeholder={t('register.passwordPlaceholder')}
                  type={showConfirmPassword ? 'text' : 'password'}
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

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('register.villageName')}
                  placeholder={t('register.villagePlaceholder')}
                  name="villageName"
                  value={formData.villageName}
                  onChange={handleChange}
                  disabled={loading}
                />
                <Input
                  label={t('common.address')}
                  placeholder={t('register.addressPlaceholder')}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-2.5 my-4 text-xs font-bold text-text-light select-none">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border-light text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                    disabled={loading}
                  />
                  <span>
                    {t('compliance.agreeTerms')}{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/terms')}
                      className="underline text-text-dark hover:opacity-80 transition-opacity"
                      disabled={loading}
                    >
                      {t('compliance.termsAndConditions')}
                    </button>
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border-light text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                    disabled={loading}
                  />
                  <span>
                    {t('compliance.agreePrivacy')}{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/privacy-policy')}
                      className="underline text-text-dark hover:opacity-80 transition-opacity"
                      disabled={loading}
                    >
                      {t('compliance.privacyPolicy')}
                    </button>
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? t('common.loading') : t('register.registerButton')}
                <Check size={18} />
              </Button>
            </form>
          )}

          {/* STEP 3: Registration Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-text-dark">{t('register.successTitle') || 'Account Created!'}</h3>
              <p className="text-text-light text-sm">
                {formData.name}, {t('register.successToast') || 'Your account is ready.'}
              </p>
              <div className="bg-primary-light text-text-dark text-xs p-3 rounded-lg font-bold">
                {t('register.redirecting') || 'Redirecting you to the Login screen in a few seconds...'}
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                {t('register.loginLink')}
              </Button>
            </div>
          )}
        </Card>

        {/* Back Link */}
        {step < 3 && (
          <div className="text-center mt-6">
            <p className="text-text-dark text-sm">
              {t('register.alreadyHaveAccount')}{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-bold underline text-text-dark hover:opacity-80 transition-opacity"
                disabled={loading}
              >
                {t('register.loginLink')}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
