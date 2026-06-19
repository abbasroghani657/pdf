import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import Logo from '../components/Logo';

export default function ForgotPasswordPage({ lang = 'en' }) {
  const isEs = lang === 'es';
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(isEs ? '¡Correo de restablecimiento de contraseña enviado!' : 'Password reset email sent!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#f8fafc]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#378ADD] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">P</div>
          <Logo />
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{isEs ? 'Restablece tu contraseña' : 'Reset your password'}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {isEs ? 'Ingresa tu correo y te enviaremos un enlace de restablecimiento.' : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                <iconify-icon icon="solar:letter-bold" class="text-4xl text-emerald-500"></iconify-icon>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">{isEs ? '¡Revisa tu bandeja de entrada!' : 'Check your inbox!'}</h3>
              <p className="text-sm text-gray-500">
                {isEs ? 'Hemos enviado un enlace de restablecimiento a ' : "We've sent a password reset link to "}<strong>{email}</strong>{isEs ? '. Revisa tu carpeta de spam si no lo ves.' : ". Check your spam folder if you don't see it."}
              </p>
              <Link
                to={isEs ? "/es/login" : "/login"}
                className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#378ADD] hover:underline"
              >
                <iconify-icon icon="solar:arrow-left-linear" class="text-base"></iconify-icon>
                {isEs ? 'Volver a iniciar sesión' : 'Back to login'}
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700">{isEs ? 'Correo electrónico' : 'Email address'}</label>
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
                    placeholder={isEs ? 'Ingresa tu correo electrónico' : 'Enter your email address'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#378ADD] hover:bg-[#2b71b8] focus:outline-none transition-all",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl"></iconify-icon>
                ) : (isEs ? 'Enviar enlace de restablecimiento' : 'Send reset link')}
              </button>

              <div className="text-center">
                <Link to={isEs ? "/es/login" : "/login"} className="text-sm font-semibold text-gray-500 hover:text-[#378ADD] transition-colors flex items-center justify-center gap-1">
                  <iconify-icon icon="solar:arrow-left-linear" class="text-base"></iconify-icon>
                  {isEs ? 'Volver a iniciar sesión' : 'Back to login'}
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
