import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { supabase } from '../lib/supabase';
import CountrySelector from '../components/CountrySelector';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [country, setCountry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeout;

    // With PKCE + detectSessionInUrl: true, Supabase automatically:
    // 1. Reads the ?code= from the URL
    // 2. Retrieves stored code_verifier from localStorage
    // 3. Exchanges code → session
    // 4. Fires onAuthStateChange with SIGNED_IN event
    //
    // We simply listen for that event instead of manually calling getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
          clearTimeout(timeout);
          await finishOAuth(session.access_token);
        }
      }
    );

    // Fallback: if no auth event fires within 12 seconds → back to login
    timeout = setTimeout(() => {
      console.warn('[OAuthCallback] No session received — redirecting to login');
      navigate('/login');
    }, 12000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  const finishOAuth = async (accessToken) => {
    try {
      // Store our app JWT and sync user to public.users table
      localStorage.setItem('pdfmaster_token', accessToken);
      const syncRes = await api.post('/auth/oauth/sync');
      if (syncRes.data.isNewUser) {
        setNeedsOnboarding(true);
      } else {
        await fetchUser();
        toast.success('Successfully signed in!');
        navigate('/');
      }
    } catch (err) {
      console.error('[OAuthCallback] Sync failed:', err);
      setError('Could not complete sign-in. Please try again.');
    }
  };

  const handleSaveCountry = async (e) => {
    e.preventDefault();
    if (!country) return;

    setIsSaving(true);
    try {
      await api.put('/auth/profile', { country });
      await fetchUser();
      toast.success('Welcome to PDFMaster!');
      navigate('/');
    } catch (err) {
      console.error('[OAuthCallback] Save country failed:', err);
      setIsSaving(false);
    }
  };

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">❌</div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Sign-in Failed</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Country onboarding (new OAuth users) ─────────────────────────────────
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

  // ── Authenticating spinner ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center font-sans">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔐</div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Signing you in...</h2>
      <p className="text-gray-500 text-sm">Please wait while we complete your Google sign-in.</p>
    </div>
  );
}
