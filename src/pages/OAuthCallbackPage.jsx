import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Supabase returns access_token in the URL hash
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
          await api.post('/auth/oauth/sync');
          // Redirect to home, AuthContext will fetch the profile
          window.location.href = '/';
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🔐</div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Authenticating...</h2>
      <p className="text-gray-500 text-sm">Please wait while we log you in.</p>
    </div>
  );
}
