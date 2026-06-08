import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import CountrySelector from '../components/CountrySelector';

const PORTAL = import.meta.env.VITE_ADMIN_PORTAL_PATH || '/x-portal-9f3a';

export default function AuthPage() {
  const [step, setStep] = useState('email'); // 'email' | 'login' | 'register'
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading States
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, loginWithOAuth, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const role = user?.profile?.role;
      if (role === 'admin' || role === 'superadmin') {
        navigate(PORTAL, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, authLoading, navigate, from]);

  // Handle Step 1: Check Email
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsCheckingEmail(true);
    try {
      const res = await api.post('/auth/check-email', { email });
      if (res.data.exists) {
        // We know their name from the backend if we want to show it, but for privacy,
        // we'll just say "Welcome back" to existing users.
        setStep('login');
      } else {
        setStep('register');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Fallback: If the check fails, we might just default to register or show error.
      // For now, let's just let them try to register if it fails.
      setStep('register');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle Step 2a: Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      const role = loggedInUser?.profile?.role;
      if (role === 'admin' || role === 'superadmin') {
        navigate(PORTAL, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error is handled by AuthContext (toast)
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2b: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ email, password, name, country });
      // After registration, the backend doesn't log them in automatically (in our current setup).
      // They are asked to log in. We can switch them back to 'login' step.
      setStep('login');
      setPassword(''); // Clear password field for login
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
      {/* Left Side: Branding / Showcase */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#0A0F1C]"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">P</div>
            <span className="font-extrabold text-3xl tracking-tight text-white">
              PDF<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Master</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 px-12 max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-extrabold text-white leading-tight mb-6"
          >
            Manage your PDFs with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Superpowers</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Join millions of professionals who use PDFMaster to compress, merge, convert, and sign documents securely in the cloud.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-3 mt-10"
          >
            {['256-bit Encryption', 'AI-Powered', 'No Limits'].map((badge, i) => (
              <div key={i} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-slate-300 flex items-center gap-2">
                <iconify-icon icon="solar:check-circle-bold" class="text-blue-400"></iconify-icon>
                {badge}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 p-12">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} PDFMaster. All rights reserved.</p>
        </div>
      </motion.div>

      {/* Right Side: Auth Flow */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#FAFBFF]"
      >
        <div className="w-full max-w-md relative">
          
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">P</div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                PDF<span className="text-blue-600">Master</span>
              </span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            
            {/* ─── STEP 1: EMAIL ENTRY ──────────────────────────────────── */}
            {step === 'email' && (
              <motion.div
                key="step-email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Sign in to PDFMaster</h2>
                  <p className="text-slate-500 text-lg">Enter your email to continue</p>
                </div>

                {/* Google OAuth (Always Prominent in Step 1) */}
                <div className="mb-8 flex">
                  <motion.button 
                    whileHover={{ y: -2 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => loginWithOAuth('google')} 
                    className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 border border-slate-200 rounded-2xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <iconify-icon icon="logos:google-icon" class="text-xl"></iconify-icon>
                    Continue with Google
                  </motion.button>
                </div>

                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#FAFBFF] text-slate-500 font-medium">Or</span>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={handleCheckEmail}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <iconify-icon icon="solar:letter-linear" class="text-xl"></iconify-icon>
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isCheckingEmail || !email}
                    className={clsx(
                      "w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all",
                      (isCheckingEmail || !email) && "opacity-80 cursor-not-allowed"
                    )}
                  >
                    {isCheckingEmail ? (
                      <iconify-icon icon="line-md:loading-twotone-loop" class="text-2xl"></iconify-icon>
                    ) : (
                      <>Continue <iconify-icon icon="solar:arrow-right-linear" class="text-lg"></iconify-icon></>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 2a: LOGIN (Existing User) ────────────────────────── */}
            {step === 'login' && (
              <motion.div
                key="step-login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Welcome back 👋</h2>
                  <p className="text-slate-500 text-lg">Enter your password to sign in</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                  {/* Read-only Email Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <iconify-icon icon="solar:letter-bold" class="text-xl"></iconify-icon>
                      </div>
                      <input
                        type="email"
                        readOnly
                        value={email}
                        className="appearance-none block w-full pl-12 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 sm:text-sm cursor-not-allowed"
                      />
                      <button 
                        type="button" 
                        onClick={() => setStep('email')}
                        className="absolute right-4 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700">Password</label>
                      <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <iconify-icon icon="solar:lock-password-linear" class="text-xl"></iconify-icon>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        className="appearance-none block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      >
                        <iconify-icon icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} class="text-xl"></iconify-icon>
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || !password}
                    className={clsx(
                      "w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all",
                      (isLoading || !password) && "opacity-80 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <iconify-icon icon="line-md:loading-twotone-loop" class="text-2xl"></iconify-icon>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 2b: REGISTER (New User) ──────────────────────────── */}
            {step === 'register' && (
              <motion.div
                key="step-register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Create your account</h2>
                  <p className="text-slate-500 text-lg">Just a few more details to get started</p>
                </div>

                <form className="space-y-5" onSubmit={handleRegister}>
                  {/* Read-only Email Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <iconify-icon icon="solar:letter-bold" class="text-xl"></iconify-icon>
                      </div>
                      <input
                        type="email"
                        readOnly
                        value={email}
                        className="appearance-none block w-full pl-12 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 sm:text-sm cursor-not-allowed"
                      />
                      <button 
                        type="button" 
                        onClick={() => setStep('email')}
                        className="absolute right-4 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <iconify-icon icon="solar:user-circle-linear" class="text-xl"></iconify-icon>
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Create Password <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <iconify-icon icon="solar:lock-password-linear" class="text-xl"></iconify-icon>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="Min. 8 characters"
                        minLength="8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      >
                        <iconify-icon icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} class="text-xl"></iconify-icon>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Country <span className="text-red-500">*</span></label>
                    <CountrySelector 
                      value={country} 
                      onChange={setCountry} 
                      required={true}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || !name || !password || !country}
                    className={clsx(
                      "w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all",
                      (isLoading || !name || !password || !country) && "opacity-80 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <iconify-icon icon="line-md:loading-twotone-loop" class="text-2xl"></iconify-icon>
                    ) : (
                      'Sign Up'
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="mt-10 text-center text-sm text-slate-500">
            By continuing, you agree to our <Link to="/terms" className="font-semibold text-slate-700 hover:text-blue-600 underline decoration-slate-300 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-slate-700 hover:text-blue-600 underline decoration-slate-300 transition-colors">Privacy Policy</Link>.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
