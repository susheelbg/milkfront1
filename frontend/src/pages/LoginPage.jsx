import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(t('login.fillAllFields') || 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn({ email: email.trim().toLowerCase(), password: password.trim() });
      toastService.success(t('login.success') || 'Signed in successfully!');

      const userRole = res?.profile?.role || res?.session?.user?.app_metadata?.role || res?.session?.user?.user_metadata?.role;
      if (userRole === 'admin' || userRole === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || 'Invalid email or password. Please try again.';
      setError(msg);
      toastService.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow accents in emerald and gold */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 p-0.5 shadow-lg shadow-emerald-950/10 mb-3">
            <div className="w-full h-full bg-[#0A2E1F] rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-amber-400">M</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-text-dark tracking-tight">MilkMaatu</h1>
          <p className="text-xs font-bold text-emerald-800 mt-1">
            {t('login.tagline') || 'Dairy Marketplace & Cattle Sante'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5">
          <div className="mb-6">
            <h2 className="text-xl font-black text-text-dark">{t('login.title') || 'Welcome Back'}</h2>
            <p className="text-xs text-text-light mt-1">
              {t('login.subtitle') || 'Sign in to access feeds, cattle sante, and your orders'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field with explicit attributes to prevent phone autofill */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                {t('login.email') || 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@milkmaatu.com"
                  className="w-full pl-10 pr-4 py-3 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-text-dark uppercase tracking-wider">
                  {t('login.password') || 'Password'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-extrabold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  {t('login.forgotPassword') || 'Forgot?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-bg-light border border-border-light rounded-xl text-text-dark placeholder-text-light/50 text-sm font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-primary hover:bg-primary-dark text-text-dark font-black rounded-xl text-sm shadow-md shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-text-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('login.submit') || 'Sign In'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-border-light text-center">
            <p className="text-xs text-text-light font-medium">
              {t('login.noAccount') || "Don't have an account?"}{' '}
              <Link
                to="/register"
                className="font-extrabold text-emerald-800 hover:text-emerald-950 transition-colors underline decoration-emerald-600/40 underline-offset-2"
              >
                {t('login.registerNow') || 'Create one here'}
              </Link>
            </p>
          </div>
        </div>

        {/* Security Assurance footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-text-light text-xs font-semibold">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>MilkMaatu Secure Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
