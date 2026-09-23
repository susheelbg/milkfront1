import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api/authApi';
import { toastService } from '../../services/toastService';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

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
      await authApi.resetPassword(email.trim());
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
    <div className="min-h-screen bg-gradient-to-br from-[#041D12] via-[#0A2E1F] to-[#041D12] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950/50 mb-2">
            <div className="w-full h-full bg-[#0A2E1F] rounded-2xl flex items-center justify-center">
              <span className="text-xl font-black text-amber-400">M</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MilkMaatu</h1>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-black text-white">Reset Password</h2>
            <p className="text-xs text-emerald-200/70 mt-1">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Check Your Inbox</h3>
                <p className="text-xs text-emerald-200/70 mt-1">
                  We've sent a password reset link to <span className="text-amber-400 font-bold">{email}</span>.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-[#0A2E1F] font-black rounded-xl text-xs"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1.5">
                  Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-[#0A2E1F] font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#0A2E1F] border-t-transparent rounded-full animate-spin" />
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
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
