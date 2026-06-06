import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import CountrySelector from '../components/CountrySelector';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, loginWithOAuth } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCountryChange = (countryName) => {
    setFormData(prev => ({ ...prev, country: countryName }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.country) return;
    
    setIsLoading(true);
    try {
      await register(formData);
      navigate('/login');
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
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Brand Header */}
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">P</div>
            <span className="font-extrabold text-3xl tracking-tight text-white">
              PDF<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">Master</span>
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
            Your ultimate PDF toolkit. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">Always free.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Create your account today and start managing your documents with lightning speed and military-grade security.
          </motion.p>
          
          {/* Feature Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-3 mt-10"
          >
            {['100% Free Tier', 'Cloud Storage', 'Global Access'].map((badge, i) => (
              <div key={i} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-slate-300 flex items-center gap-2">
                <iconify-icon icon="solar:check-circle-bold" class="text-indigo-400"></iconify-icon>
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

      {/* Right Side: Register Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#FAFBFF] overflow-y-auto max-h-screen"
      >
        <div className="w-full max-w-md py-12">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">P</div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                PDF<span className="text-indigo-600">Master</span>
              </span>
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Create Account</h2>
            <p className="text-slate-500 text-lg">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
                Log in here
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <iconify-icon icon="solar:user-linear" class="text-xl"></iconify-icon>
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <iconify-icon icon="solar:letter-linear" class="text-xl"></iconify-icon>
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                  <iconify-icon icon="solar:global-linear" class="text-xl"></iconify-icon>
                </div>
                <div className="relative z-0 [&>div>div]:pl-12 [&>div>div]:py-3.5 [&>div>div]:bg-white [&>div>div]:border-slate-200 [&>div>div]:rounded-2xl [&>div>div]:shadow-sm">
                  <CountrySelector
                    value={formData.country}
                    onChange={handleCountryChange}
                    required={true}
                    placeholder="Select your country"
                  />
                </div>
              </div>
              {!formData.country && (
                <p className="mt-2 text-xs font-medium text-slate-400">Please select your country to continue</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <iconify-icon icon="solar:lock-password-linear" class="text-xl"></iconify-icon>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
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
              <p className="mt-2 text-xs font-medium text-slate-400">Must be at least 6 characters long.</p>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !formData.country}
                className={clsx(
                  "w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all",
                  (isLoading || !formData.country) && "opacity-80 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <iconify-icon icon="line-md:loading-twotone-loop" class="text-2xl"></iconify-icon>
                ) : (
                  'Create Free Account'
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
            By signing up, you agree to our <Link to="/terms" className="font-semibold text-slate-700 hover:text-indigo-600 underline decoration-slate-300 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-slate-700 hover:text-indigo-600 underline decoration-slate-300 transition-colors">Privacy Policy</Link>.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
