import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api/authApi';
import { toastService } from '../../services/toastService';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(email.trim().toLowerCase());
      setSubmitted(true);
      toastService.success('Password reset link sent to your email!');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email.');
      toastService.error(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient decorative glow */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 p-0.5 shadow-lg shadow-emerald-950/10 mb-2">
            <div className="w-full h-full bg-[#0A2E1F] rounded-2xl flex items-center justify-center">
              <span className="text-xl font-black text-amber-400">M</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-text-dark tracking-tight">MilkMaatu</h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-border-light rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5">
          <div className="mb-6">
            <h2 className="text-xl font-black text-text-dark">Reset Password</h2>
            <p className="text-xs text-text-light mt-1">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-dark">Check Your Inbox</h3>
                <p className="text-xs text-text-light mt-1">
                  We've sent a password reset link to <span className="text-emerald-800 font-bold">{email}</span>.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-2.5 bg-primary hover:bg-primary-dark text-text-dark font-black rounded-xl text-xs shadow-md transition-all"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                  <input
                    id="forgot-email"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-primary hover:bg-primary-dark text-text-dark font-black rounded-xl text-sm shadow-md shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-text-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <Send size={15} />
                  </>
                )}
              </button>

              <div className="pt-3 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
