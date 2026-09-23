import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailRegistered, setIsEmailRegistered] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setIsEmailRegistered(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsEmailRegistered(false);

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError(t('register.fillRequired') || 'Please fill in Name, Email, and Password.');
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.passwordTooShort') || 'Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch') || 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password,
      });

      toastService.success(t('register.success') || 'Account created successfully! Welcome to MilkMaatu.');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const isDuplicate =
        err.code === 'EMAIL_ALREADY_REGISTERED' ||
        (err.message && (
          err.message.includes('EMAIL_ALREADY_REGISTERED') ||
          err.message.toLowerCase().includes('already registered') ||
          err.message.toLowerCase().includes('already in use') ||
          err.message.toLowerCase().includes('user already exists')
        ));

      if (isDuplicate) {
        setIsEmailRegistered(true);
        setError('This email is already registered. Please log in instead.');
      } else {
        setIsEmailRegistered(false);
        const msg = err.message || 'Failed to create account. Please check your information.';
        setError(msg);
        toastService.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 p-0.5 shadow-lg shadow-emerald-900/10 mb-2">
            <div className="w-full h-full bg-[#0A2E1F] rounded-2xl flex items-center justify-center">
              <span className="text-xl font-black text-amber-400">M</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-text-dark tracking-tight">MilkMaatu</h1>
          <p className="text-xs font-bold text-emerald-800 mt-0.5">
            {t('register.tagline') || 'Join our dairy farmer community'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5">
          <div className="mb-5">
            <h2 className="text-xl font-black text-text-dark">{t('register.title') || 'Create Account'}</h2>
            <p className="text-xs text-text-light mt-1">
              {t('register.subtitle') || 'Enter your details to register as a farmer'}
            </p>
          </div>

          {error && (
            <div className={`mb-4 p-4 rounded-xl border animate-shake ${
              isEmailRegistered
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className={isEmailRegistered ? 'text-amber-600 shrink-0 mt-0.5' : 'text-red-500 shrink-0 mt-0.5'} />
                <div className="flex-1">
                  <p className="text-xs font-bold">{error}</p>
                  {isEmailRegistered && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between">
                      <span className="text-[11px] text-amber-800 font-medium">Already have an account?</span>
                      <Link
                        to="/login"
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>Go to Login</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                {t('profile.fullName') || 'Full Name'} *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={17} />
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ramesh Gowda"
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                {t('login.email') || 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={17} />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="farmer@milkmaatu.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Phone (Isolated autocomplete) */}
            <div>
              <label htmlFor="register-phone" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                {t('common.phone') || 'Mobile Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={17} />
                <input
                  id="register-phone"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Village / Address */}
            <div>
              <label htmlFor="register-address" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                {t('profile.villageName') || 'Village / Address'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={17} />
                <input
                  id="register-address"
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Thendekere, Mandya"
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                {t('login.password') || 'Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={17} />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-11 py-2.5 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                {t('register.confirmPassword') || 'Confirm Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={17} />
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-primary hover:bg-primary-dark text-text-dark font-black rounded-xl text-sm shadow-md shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-text-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('register.submit') || 'Create Farmer Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 pt-4 border-t border-border-light text-center">
            <p className="text-xs text-text-light font-medium">
              {t('register.alreadyHaveAccount') || 'Already have an account?'}{' '}
              <Link
                to="/login"
                className="font-extrabold text-emerald-800 hover:text-emerald-950 transition-colors underline decoration-emerald-600/40 underline-offset-2"
              >
                {t('login.submit') || 'Sign In'}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-text-light text-xs font-semibold">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Role-Based Access Protected</span>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
