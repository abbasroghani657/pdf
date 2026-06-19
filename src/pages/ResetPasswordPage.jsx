import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage({ lang = 'en' }) {
  const isEs = lang === 'es';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Supabase embeds access_token in URL hash when user clicks reset link
    // e.g. /reset-password#access_token=xxx&type=recovery
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const token = params.get('access_token');
    const type = params.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
    }
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error(isEs ? 'La contraseña debe tener al menos 8 caracteres.' : 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isEs ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { accessToken, password });
      toast.success(isEs ? '¡Contraseña actualizada con éxito! Por favor inicia sesión.' : 'Password updated successfully! Please log in.');
      setTimeout(() => navigate(isEs ? '/es/login' : '/login'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEs ? 'Error al restablecer la contraseña. El enlace puede haber expirado.' : 'Failed to reset password. Link may have expired.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#378ADD] rounded-xl flex items-center justify-center shadow-lg">
              <iconify-icon icon="solar:document-bold-duotone" class="text-white text-xl" />
            </div>
            <span className="text-xl font-black text-gray-900">TheyLovePDF</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isEs ? 'Establecer nueva contraseña' : 'Set new password'}</h1>
          <p className="text-sm text-gray-500 mt-2">{isEs ? 'Elige una contraseña segura para tu cuenta' : 'Choose a strong password for your account'}</p>
        </div>

        {!accessToken ? (
          // Invalid / expired link
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500 text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{isEs ? 'Enlace inválido o expirado' : 'Invalid or Expired Link'}</h2>
            <p className="text-sm text-gray-500 mb-6">
              {isEs ? 'Este enlace ha expirado o es inválido. Por favor solicita uno nuevo.' : 'This password reset link has expired or is invalid. Please request a new one.'}
            </p>
            <Link
              to={isEs ? "/es/forgot-password" : "/forgot-password"}
              className="inline-block bg-[#378ADD] hover:bg-[#2b71b8] text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              {isEs ? 'Solicitar un nuevo enlace' : 'Request New Link'}
            </Link>
          </div>
        ) : (
          // Valid token — show form
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {isEs ? 'Nueva contraseña' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEs ? 'Mín. 8 caracteres' : 'Min. 8 characters'}
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
                  {isEs ? 'Confirmar contraseña' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isEs ? 'Vuelve a ingresar tu contraseña' : 'Re-enter your password'}
                    required
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <iconify-icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg" />
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
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
                    {isEs ? 'Actualizar contraseña' : 'Update Password'}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {isEs ? '¿Recuerdas tu contraseña?' : 'Remember your password?'}{' '}
              <Link to={isEs ? "/es/login" : "/login"} className="text-[#378ADD] font-semibold hover:underline">
                {isEs ? 'Iniciar sesión' : 'Sign in'}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
