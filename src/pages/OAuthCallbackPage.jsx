import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { supabase } from '../lib/supabase';
import CountrySelector from '../components/CountrySelector';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [country, setCountry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Let Supabase browser client handle the PKCE code exchange automatically.
        // It reads ?code= from URL, retrieves stored code_verifier from localStorage,
        // and returns the session.
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Supabase session error:', error);
          navigate('/login');
          return;
        }

        const session = data?.session;

        // If no session yet — might have an auth code in URL, try exchanging
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        if (!session && code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);

          if (exchangeError) {
            console.error('PKCE exchange failed:', exchangeError);
            navigate('/login');
            return;
          }

          if (exchangeData?.session) {
            await finishOAuth(exchangeData.session.access_token);
            return;
          }
        }

        if (session?.access_token) {
          await finishOAuth(session.access_token);
          return;
        }

        // Nothing worked — back to login
        navigate('/login');
      } catch (err) {
        console.error('OAuth callback error:', err);
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  const finishOAuth = async (accessToken) => {
    try {
      // Store our app's token and sync user to public.users
      localStorage.setItem('pdfmaster_token', accessToken);
      const syncRes = await api.post('/auth/oauth/sync');
      if (syncRes.data.isNewUser) {
        setNeedsOnboarding(true);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Failed to sync OAuth user:', err);
      navigate('/login');
    }
  };

  const handleSaveCountry = async (e) => {
    e.preventDefault();
    if (!country) return;

    setIsSaving(true);
    try {
      await api.put('/auth/profile', { country });
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save country:', error);
      setIsSaving(false);
    }
  };

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">👋</div>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">Almost there!</h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Select your country to complete your PDFMaster profile.
          </p>

          <form onSubmit={handleSaveCountry} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <CountrySelector
                value={country}
                onChange={setCountry}
                required={true}
                placeholder="Select your country"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving || !country}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl"></iconify-icon>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center font-sans">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔐</div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Authenticating...</h2>
      <p className="text-gray-500 text-sm">Please wait while we set up your session.</p>
    </div>
  );
}
