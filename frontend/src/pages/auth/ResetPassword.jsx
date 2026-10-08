import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const EXPIRED_LINK_MESSAGE = 'This password reset link has expired. Please request a new password reset link.';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { recoveryStatus, clearPasswordRecovery } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setUpdating(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      clearPasswordRecovery();
      setUpdated(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      setError(updateError.message || 'Could not update your password. Please request a new reset link.');
    } finally {
      setUpdating(false);
    }
  };

  const requestNewLink = () => {
    clearPasswordRecovery();
    navigate('/forgot-password', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black text-black">Milk<span>ಮಾತು</span></h1>
        </div>
        <section className="rounded-2xl border border-border-light bg-white p-6 shadow-xl sm:p-8">
          {updated ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 size={42} className="mx-auto text-emerald-700" />
              <h2 className="text-xl font-black text-text-dark">Password Updated</h2>
              <p className="text-sm text-text-light">Your password has been changed. Sign in with your new password.</p>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-dark">
                <ArrowLeft size={16} /> Go to Login
              </Link>
            </div>
          ) : recoveryStatus === 'checking' ? (
            <div className="py-8 text-center text-sm font-semibold text-text-light">Verifying your password reset link...</div>
          ) : recoveryStatus !== 'active' ? (
            <div className="space-y-4 text-center">
              <AlertCircle size={42} className="mx-auto text-amber-700" />
              <h2 className="text-xl font-black text-text-dark">Reset Link Unavailable</h2>
              <p role="alert" className="text-sm text-text-light">{EXPIRED_LINK_MESSAGE}</p>
              <button type="button" onClick={requestNewLink} className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-text-dark">
                Request a New Reset Link
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-black text-text-dark">Create New Password</h2>
                <p className="mt-1 text-sm text-text-light">Choose a new password for your account.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <label className="block text-sm font-semibold text-text-dark">
                  New Password
                  <span className="relative mt-1.5 block">
                    <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="w-full rounded-xl border border-border-light bg-bg-light py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-700"
                    />
                  </span>
                </label>
                <label className="block text-sm font-semibold text-text-dark">
                  Confirm Password
                  <span className="relative mt-1.5 block">
                    <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full rounded-xl border border-border-light bg-bg-light py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-700"
                    />
                  </span>
                </label>
                <button type="submit" disabled={updating} className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-black text-text-dark disabled:cursor-not-allowed disabled:opacity-60">
                  {updating ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;