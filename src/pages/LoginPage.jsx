import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#f8fafc]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#378ADD] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
          <span className="font-bold text-2xl"><span className="text-[#378ADD]">PDF</span>Master</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Log in to your account</h2>
        <p className="mt-2 text-sm text-gray-500">
          Or{' '}
          <Link to="/register" className="font-semibold text-[#378ADD] hover:underline">
            start your 7-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email address</label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <iconify-icon icon="solar:letter-linear" class="text-lg"></iconify-icon>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#378ADD] focus:border-[#378ADD] sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#378ADD] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <iconify-icon icon="solar:lock-password-linear" class="text-lg"></iconify-icon>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#378ADD] focus:border-[#378ADD] sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#378ADD] hover:bg-[#2b71b8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#378ADD] transition-all",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl"></iconify-icon>
                ) : (
                  'Log in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <iconify-icon icon="logos:google-icon" class="text-lg"></iconify-icon>
              </button>
              <button className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <iconify-icon icon="logos:github-icon" class="text-lg"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          By logging in, you agree to our <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
