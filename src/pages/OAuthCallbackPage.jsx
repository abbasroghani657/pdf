import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [country, setCountry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const countries = ['Pakistan', 'India', 'USA', 'UK', 'Canada', 'Australia', 'UAE', 'Saudi Arabia', 'Germany', 'Other'];

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // 1. Check for PKCE code in query params
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      if (code) {
        try {
          // Exchange code for session via backend
          const res = await api.post('/auth/oauth/exchange', { code });
          localStorage.setItem('pdfmaster_token', res.data.access_token);
          
          // Sync user to public.users
          const syncRes = await api.post('/auth/oauth/sync');
          if (syncRes.data.isNewUser) {
            setNeedsOnboarding(true);
          } else {
            window.location.href = '/';
          }
          return; // Exit after successful PKCE flow
        } catch (error) {
          console.error('Failed to exchange code or sync OAuth user:', error);
          navigate('/login');
          return;
        }
      }

      // 2. Fallback to implicit flow (hash)
      const hash = window.location.hash;
      if (!hash) {
        navigate('/login');
        return;
      }

      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      const type = params.get('type');

      if (accessToken && (type === 'signup' || type === 'recovery' || !type || type === 'magiclink' || type === 'oauth')) {
        // Save the token
        localStorage.setItem('pdfmaster_token', accessToken);

        try {
          // Sync user to public.users table if they don't exist yet
          const res = await api.post('/auth/oauth/sync');
          
          if (res.data.isNewUser) {
            setNeedsOnboarding(true);
          } else {
            // Redirect to home, AuthContext will fetch the profile
            window.location.href = '/';
          }
        } catch (error) {
          console.error('Failed to sync OAuth user:', error);
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">👋</div>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">Complete your profile</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Please select your country to continue to PDFMaster.</p>
          
          <form onSubmit={handleSaveCountry} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-[#378ADD] focus:border-[#378ADD] sm:text-sm transition-colors bg-gray-50"
              >
                <option value="" disabled>Select your country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isSaving || !country}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#378ADD] hover:bg-[#2b71b8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#378ADD] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🔐</div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Authenticating...</h2>
      <p className="text-gray-500 text-sm">Please wait while we set up your session.</p>
    </div>
  );
}
