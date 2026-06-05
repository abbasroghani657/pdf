import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Supabase embeds the recovery token in the URL hash
    // When the user clicks the reset email link, Supabase automatically
    // sets the session from the URL hash — we just need to check for it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
      setCheckingSession(false);
    });

    // Also check if there's already an active session with recovery type
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsValidSession(true);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated successfully! Please log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      toast.error(error.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#378ADD] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#378ADD] rounded-xl flex items-center justify-center shadow-lg">
              <iconify-icon icon="solar:document-bold-duotone" class="text-white text-xl" />
            </div>
            <span className="text-xl font-black text-gray-900">PDFMaster</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-sm text-gray-500 mt-2">Choose a strong password for your account</p>
        </div>

        {!isValidSession ? (
          // Invalid / expired link
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500 text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
            <p className="text-sm text-gray-500 mb-6">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-[#378ADD] hover:bg-[#2b71b8] text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          // Valid session — show form
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <iconify-icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-all"
                />
              </div>

              {/* Password strength hint */}
              {password && (
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        password.length > i * 3
                          ? password.length < 8 ? 'bg-red-400' : password.length < 12 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#378ADD] hover:bg-[#2b71b8] disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl" />
                ) : (
                  <>
                    <iconify-icon icon="solar:lock-keyhole-bold" class="text-lg" />
                    Update Password
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-[#378ADD] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
