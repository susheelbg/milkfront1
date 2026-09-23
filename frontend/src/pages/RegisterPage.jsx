import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      const msg = err.message || 'Failed to create account. Please check your information.';
      setError(msg);
      toastService.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041D12] via-[#0A2E1F] to-[#041D12] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/50 mb-2">
            <div className="w-full h-full bg-[#0A2E1F] rounded-2xl flex items-center justify-center">
              <span className="text-xl font-black text-amber-400">M</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MilkMaatu</h1>
          <p className="text-xs font-semibold text-emerald-300/80 mt-0.5">
            {t('register.tagline') || 'Join our dairy farmer community'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="mb-5">
            <h2 className="text-xl font-black text-white">{t('register.title') || 'Create Account'}</h2>
            <p className="text-xs text-emerald-200/70 mt-1">
              {t('register.subtitle') || 'Enter your details to register as a farmer'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                {t('profile.fullName') || 'Full Name'} *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={17} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ramesh Gowda"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                {t('login.email') || 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={17} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="farmer@milkmaatu.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Phone (No OTP required) */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                {t('common.phone') || 'Mobile Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={17} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Village / Address */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                {t('profile.villageName') || 'Village / Address'}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={17} />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Thendekere, Mandya"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                {t('login.password') || 'Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-11 py-2.5 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
                {t('register.confirmPassword') || 'Confirm Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#0A2E1F] font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0A2E1F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('register.submit') || 'Create Farmer Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 pt-4 border-t border-emerald-500/20 text-center">
            <p className="text-xs text-emerald-100/70 font-medium">
              {t('register.alreadyHaveAccount') || 'Already have an account?'}{' '}
              <Link
                to="/login"
                className="font-extrabold text-amber-400 hover:text-amber-300 transition-colors underline decoration-amber-400/40 underline-offset-2"
              >
                {t('login.submit') || 'Sign In'}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-emerald-300/60 text-xs font-medium">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Role-Based Access Protected</span>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
