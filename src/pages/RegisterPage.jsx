import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import CountrySelector from '../components/CountrySelector';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCountryChange = (countryName) => {
    setFormData(prev => ({ ...prev, country: countryName }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.country) {
      return;
    }
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
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#f8fafc]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#378ADD] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
          <span className="font-bold text-2xl"><span className="text-[#378ADD]">PDF</span>Master</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create an account</h2>
        <p className="mt-2 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#378ADD] hover:underline">
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <iconify-icon icon="solar:user-linear" class="text-lg"></iconify-icon>
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#378ADD] focus:border-[#378ADD] sm:text-sm transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <iconify-icon icon="solar:letter-linear" class="text-lg"></iconify-icon>
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#378ADD] focus:border-[#378ADD] sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
                  <iconify-icon icon="solar:global-linear" class="text-lg"></iconify-icon>
                </div>
                <CountrySelector
                  value={formData.country}
                  onChange={handleCountryChange}
                  required={true}
                  placeholder="Select your country"
                />
              </div>
              {!formData.country && (
                <p className="mt-1 text-xs text-gray-400">Please select your country to continue</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <iconify-icon icon="solar:lock-password-linear" class="text-lg"></iconify-icon>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#378ADD] focus:border-[#378ADD] sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Must be at least 6 characters long.</p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !formData.country}
                className={clsx(
                  "w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#378ADD] hover:bg-[#2b71b8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#378ADD] transition-all",
                  (isLoading || !formData.country) && "opacity-60 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl"></iconify-icon>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          By signing up, you agree to our <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
