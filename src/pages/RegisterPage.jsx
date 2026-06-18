import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';
import CountrySelector from '../components/CountrySelector';

const PORTAL = import.meta.env.VITE_ADMIN_PORTAL_PATH || '/x-portal-9f3a';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, loginWithOAuth, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'];
  const rawFrom = location.state?.from?.pathname;
  const from = (rawFrom && !AUTH_PAGES.includes(rawFrom)) ? rawFrom : '/';

  // If already logged in, redirect
  useEffect(() => {
    if (user && !authLoading) {
      const role = user?.profile?.role;
      navigate(role === 'admin' || role === 'superadmin' ? PORTAL : from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setIsLoading(true);
    try {
      await register({ email, password, name, country });
      // Redirect to login so they can log in
      navigate('/login', { replace: true });
    } catch (error) {
      setRegisterError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">

      {/* ── Left panel (branding, desktop only) ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#080D1A]"
      >
        {/* Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[560px] h-[560px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 px-10 pt-8 pb-0">
          <Link to="/" className="inline-block group">
            <Logo invert={true} className="group-hover:scale-105 transition-transform" />
          </Link>
        </div>

        {/* Headline */}
        <div className="relative z-10 px-10">
          <p className="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-3">The PDF Platform</p>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Every PDF tool<br/>you'll ever need.
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm mb-6">
            Convert, compress, merge, sign, and protect<br/>documents in one place.
          </p>

          {/* Checkmarks */}
          <div className="space-y-2.5 mb-7">
            {[
              '40+ PDF tools',
              'Files deleted after processing',
              'AI-powered: Chat, Summarize, Translate',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                  <span className="text-blue-300 text-xs font-bold">✓</span>
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Trust badges row */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            {['256-bit Encryption', 'AI-Powered', 'Privacy First'].map((badge, i) => (
              <span key={i} className={`text-[11px] font-semibold text-slate-400 ${i < 2 ? "after:content-['|'] after:ml-3 after:text-slate-600" : ''}`}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-10 pb-7">
          <p className="text-slate-500 text-xs mb-1">Trusted by professionals worldwide.</p>
          <p className="text-slate-700 text-xs">© {new Date().getFullYear()} TheyLovePDF · All rights reserved.</p>
        </div>
      </motion.div>

      {/* ── Right panel (auth form) ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#F7F8FC]">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="inline-block mb-6 sm:hidden">
              <Logo size="sm" />
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create an account</h2>
              <p className="text-slate-500 text-sm">Join us today. It's free!</p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => loginWithOAuth('google')}
              className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm mb-5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#F7F8FC] text-xs text-slate-400 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Traditional Register form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <iconify-icon icon="solar:user-circle-linear" class="text-lg"></iconify-icon>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => { setName(e.target.value); setRegisterError(''); }}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <iconify-icon icon="solar:letter-linear" class="text-lg"></iconify-icon>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setRegisterError(''); }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <iconify-icon icon="solar:lock-password-linear" class="text-lg"></iconify-icon>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setRegisterError(''); }}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <iconify-icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg"></iconify-icon>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Country</label>
                <CountrySelector value={country} onChange={setCountry} required={true} />
              </div>

              {registerError && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <iconify-icon icon="solar:danger-circle-bold" class="text-sm"></iconify-icon>
                  {registerError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || !name || !email || !password || !country}
                className={clsx(
                  'w-full flex justify-center items-center py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all mt-4',
                  (isLoading || !name || !email || !password || !country) && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isLoading
                  ? <iconify-icon icon="line-md:loading-twotone-loop" class="text-lg"></iconify-icon>
                  : 'Sign up'
                }
              </button>

              <div className="text-center mt-6 text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Log in
                </Link>
              </div>

            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
