import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';

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
      const res = await signIn({ email: email.trim(), password: password.trim() });
      toastService.success(t('login.success') || 'Signed in successfully!');

      const userRole = res?.profile?.role;
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
    <div className="min-h-screen bg-gradient-to-br from-[#041D12] via-[#0A2E1F] to-[#041D12] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/50 mb-3">
            <div className="w-full h-full bg-[#0A2E1F] rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-amber-400">M</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MilkMaatu</h1>
          <p className="text-xs font-semibold text-emerald-300/80 mt-1">
            {t('login.tagline') || 'Dairy Marketplace & Cattle Sante'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-black text-white">{t('login.title') || 'Welcome Back'}</h2>
            <p className="text-xs text-emerald-200/70 mt-1">
              {t('login.subtitle') || 'Sign in to access feeds, cattle sante, and your orders'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1.5">
                {t('login.email') || 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@milkmaatu.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  {t('login.password') || 'Password'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {t('login.forgotPassword') || 'Forgot?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/40 text-sm font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#0A2E1F] font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0A2E1F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('login.submit') || 'Sign In'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-emerald-500/20 text-center">
            <p className="text-xs text-emerald-100/70 font-medium">
              {t('login.noAccount') || "Don't have an account?"}{' '}
              <Link
                to="/register"
                className="font-extrabold text-amber-400 hover:text-amber-300 transition-colors underline decoration-amber-400/40 underline-offset-2"
              >
                {t('login.registerNow') || 'Create one here'}
              </Link>
            </p>
          </div>
        </div>

        {/* Security Assurance footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-emerald-300/60 text-xs font-medium">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>MilkMaatu Secure Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
