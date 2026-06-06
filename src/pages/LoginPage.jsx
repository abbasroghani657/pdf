import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const PORTAL = import.meta.env.VITE_ADMIN_PORTAL_PATH || '/x-portal-9f3a';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithOAuth, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      // ✅ Admin/Superadmin ko portal pe redirect karo
      const role = loggedInUser?.profile?.role;
      if (role === 'admin' || role === 'superadmin') {
        navigate(PORTAL, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error handled by AuthContext toast
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
        {/* Animated Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Brand Header */}
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">P</div>
            <span className="font-extrabold text-3xl tracking-tight text-white">
              PDF<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Master</span>
            </span>
          </Link>
        </div>

        {/* Hero Content */}
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
          
          {/* Feature Badges */}
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

        {/* Footer Area */}
        <div className="relative z-10 p-12">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} PDFMaster. All rights reserved.</p>
        </div>
      </motion.div>

      {/* Right Side: Login Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#FAFBFF]"
      >
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">P</div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                PDF<span className="text-blue-600">Master</span>
              </span>
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Welcome back</h2>
            <p className="text-slate-500 text-lg">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Start for free
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all",
                  isLoading && "opacity-80 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <iconify-icon icon="line-md:loading-twotone-loop" class="text-2xl"></iconify-icon>
                ) : (
                  'Log In to Account'
                )}
              </button>
            </motion.div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#FAFBFF] text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ y: -2 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => loginWithOAuth('google')} 
                className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 border border-slate-200 rounded-2xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <iconify-icon icon="logos:google-icon" class="text-xl"></iconify-icon>
                Google
              </motion.button>
              <motion.button 
                whileHover={{ y: -2 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => loginWithOAuth('github')} 
                className="w-full inline-flex justify-center items-center gap-2 py-3.5 px-4 border border-slate-200 rounded-2xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <iconify-icon icon="logos:github-icon" class="text-xl"></iconify-icon>
                GitHub
              </motion.button>
            </div>
          </div>
          
          <div className="mt-10 text-center text-sm text-slate-500">
            By logging in, you agree to our <Link to="/terms" className="font-semibold text-slate-700 hover:text-blue-600 underline decoration-slate-300 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-slate-700 hover:text-blue-600 underline decoration-slate-300 transition-colors">Privacy Policy</Link>.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
