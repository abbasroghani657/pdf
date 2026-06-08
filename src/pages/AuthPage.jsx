import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import CountrySelector from '../components/CountrySelector';

const PORTAL = import.meta.env.VITE_ADMIN_PORTAL_PATH || '/x-portal-9f3a';

// step: 'email' → 'login' | 'register' | 'google'
// 'google'  = user exists but signed up via Google — show Google button only

export default function AuthPage() {
  const [step, setStep] = useState('email');

  // Form fields
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [name, setName]             = useState('');
  const [country, setCountry]       = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading / feedback
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [loginError, setLoginError] = useState('');       // inline error under password
  const [registerError, setRegisterError] = useState(''); // inline error under register btn

  // Detected user name (from check-email, shown as "Welcome back, Abbas")
  const [detectedName, setDetectedName] = useState('');

  const passwordRef = useRef(null);

  const { login, register, loginWithOAuth, user, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  // If already logged in → redirect
  useEffect(() => {
    if (user && !authLoading) {
      const role = user?.profile?.role;
      navigate(role === 'admin' || role === 'superadmin' ? PORTAL : from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  // Auto-focus password when step changes to 'login'
  useEffect(() => {
    if (step === 'login') {
      setTimeout(() => passwordRef.current?.focus(), 120);
    }
  }, [step]);

  // ── Step 1: Check Email ───────────────────────────────────────────────────
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsCheckingEmail(true);
    setLoginError('');
    setRegisterError('');

    try {
      const res = await api.post('/auth/check-email', { email });
      const { exists, name: foundName, provider } = res.data;

      if (!exists) {
        setStep('register');
      } else if (provider === 'google') {
        setDetectedName(foundName || '');
        setStep('google');       // ← Google-only account
      } else {
        setDetectedName(foundName || '');
        setStep('login');
      }
    } catch (err) {
      // On network error → don't silently go to register. Show inline error.
      const msg = err.response?.data?.message;
      if (err.response?.status === 429) {
        setLoginError('Too many attempts. Please wait a moment.');
      } else if (msg) {
        setLoginError(msg);
      } else {
        // Real fallback only if truly can't reach server
        setStep('register');
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // ── Step 2a: Login ────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      const role = loggedInUser?.profile?.role;
      navigate(role === 'admin' || role === 'superadmin' ? PORTAL : from, { replace: true });
    } catch (error) {
      const raw = error.message || '';
      // Detect "use Google" hint from backend
      if (raw.toLowerCase().includes('google')) {
        setStep('google');
      } else if (raw.toLowerCase().includes('invalid') || raw.toLowerCase().includes('credentials')) {
        setLoginError('Incorrect password. Please try again.');
      } else {
        setLoginError(raw || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2b: Register ─────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setIsLoading(true);
    try {
      await register({ email, password, name, country });
      // Auto-transition to login step — email pre-filled, password cleared
      setPassword('');
      setStep('login');
    } catch (error) {
      setRegisterError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared: back to email step ────────────────────────────────────────────
  const goBack = () => {
    setStep('email');
    setLoginError('');
    setRegisterError('');
    setPassword('');
  };

  // ── Shared layout wrapper ─────────────────────────────────────────────────
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
  };
  const panelVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
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
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform">P</div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              PDF<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Master</span>
            </span>
          </Link>
        </div>

        {/* Headline */}
        <div className="relative z-10 px-12 max-w-md">
          <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-4">The PDF platform</p>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-5">
            Every PDF tool<br/>you'll ever need.
          </h1>
          <p className="text-slate-400 leading-relaxed text-sm mb-10">
            Convert, compress, merge, sign, and protect documents — all in one place. Trusted by 2 million+ professionals.
          </p>

          {/* Social proof */}
          <div className="space-y-3">
            {[
              { icon: '⚡', text: '37 PDF tools in one platform' },
              { icon: '🔒', text: 'Files deleted after processing' },
              { icon: '🤖', text: 'AI-powered: Summarize, Translate, Chat' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-12">
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} PDFMaster · All rights reserved.</p>
        </div>
      </motion.div>

      {/* ── Right panel (auth form) ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#F7F8FC]">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">P</div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">PDF<span className="text-blue-600">Master</span></span>
            </Link>
          </div>

          <AnimatePresence mode="wait">

            {/* ─── STEP: EMAIL ────────────────────────────────────────── */}
            {step === 'email' && (
              <motion.div key="email" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Sign in to PDFMaster</h2>
                  <p className="text-slate-500 text-sm">Enter your email to continue</p>
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
                    <span className="px-3 bg-[#F7F8FC] text-xs text-slate-400 font-medium">or continue with email</span>
                  </div>
                </div>

                {/* Email form */}
                <form onSubmit={handleCheckEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLoginError(''); }}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    {loginError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <iconify-icon icon="solar:danger-circle-bold" class="text-sm"></iconify-icon>
                        {loginError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckingEmail || !email}
                    className={clsx(
                      'w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all',
                      (isCheckingEmail || !email) && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {isCheckingEmail
                      ? <><iconify-icon icon="line-md:loading-twotone-loop" class="text-lg"></iconify-icon> Checking...</>
                      : <>Continue <iconify-icon icon="solar:arrow-right-linear" class="text-base"></iconify-icon></>
                    }
                  </button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP: LOGIN ─────────────────────────────────────────── */}
            {step === 'login' && (
              <motion.div key="login" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                    {detectedName ? `Welcome back, ${detectedName.split(' ')[0]} 👋` : 'Welcome back 👋'}
                  </h2>
                  <p className="text-slate-500 text-sm">Enter your password to sign in</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Read-only email chip */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <iconify-icon icon="solar:letter-bold" class="text-blue-600 text-xs"></iconify-icon>
                      </div>
                      <span className="text-sm text-slate-700 font-medium truncate">{email}</span>
                    </div>
                    <button type="button" onClick={goBack} className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-2 flex-shrink-0">
                      Change
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
                      <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                        placeholder="Enter your password"
                        className={clsx(
                          'w-full px-3.5 py-2.5 pr-10 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all',
                          loginError
                            ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <iconify-icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg"></iconify-icon>
                      </button>
                    </div>
                    {loginError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <iconify-icon icon="solar:danger-circle-bold" class="text-sm"></iconify-icon>
                        {loginError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !password}
                    className={clsx(
                      'w-full flex justify-center items-center py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all',
                      (isLoading || !password) && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {isLoading
                      ? <iconify-icon icon="line-md:loading-twotone-loop" class="text-lg"></iconify-icon>
                      : 'Sign In'
                    }
                  </button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP: GOOGLE-ONLY ACCOUNT ──────────────────────────── */}
            {step === 'google' && (
              <motion.div key="google" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                    {detectedName ? `Hi, ${detectedName.split(' ')[0]}` : 'Use Google to sign in'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    This account is linked to Google. Sign in with Google to continue.
                  </p>
                </div>

                {/* Email chip */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl mb-5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <iconify-icon icon="solar:letter-bold" class="text-blue-600 text-xs"></iconify-icon>
                    </div>
                    <span className="text-sm text-slate-700 font-medium truncate">{email}</span>
                  </div>
                  <button type="button" onClick={goBack} className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-2 flex-shrink-0">
                    Change
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => loginWithOAuth('google')}
                  className="w-full flex justify-center items-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </motion.div>
            )}

            {/* ─── STEP: REGISTER ──────────────────────────────────────── */}
            {step === 'register' && (
              <motion.div key="register" variants={panelVariants} initial="initial" animate="animate" exit="exit">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account</h2>
                  <p className="text-slate-500 text-sm">A few details to get started</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Read-only email chip */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <iconify-icon icon="solar:letter-bold" class="text-blue-600 text-xs"></iconify-icon>
                      </div>
                      <span className="text-sm text-slate-700 font-medium truncate">{email}</span>
                    </div>
                    <button type="button" onClick={goBack} className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-2 flex-shrink-0">
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setRegisterError(''); }}
                        placeholder="Min. 8 characters"
                        className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                    <p className="text-xs text-red-600 flex items-center gap-1 -mt-1">
                      <iconify-icon icon="solar:danger-circle-bold" class="text-sm"></iconify-icon>
                      {registerError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !name || !password || !country}
                    className={clsx(
                      'w-full flex justify-center items-center py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all',
                      (isLoading || !name || !password || !country) && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {isLoading
                      ? <iconify-icon icon="line-md:loading-twotone-loop" class="text-lg"></iconify-icon>
                      : 'Create Account'
                    }
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-slate-600 hover:text-blue-600 underline underline-offset-2">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-slate-600 hover:text-blue-600 underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
