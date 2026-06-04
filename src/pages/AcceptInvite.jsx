import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

export default function AcceptInvite() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const action = searchParams.get('action') || 'accept';

  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      navigate('/invite-response?status=invalid');
      return;
    }

    // Call backend via redirect — the backend handles the redirect itself
    // We just redirect the browser to the API endpoint
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';
    window.location.href = `${apiBase}/admin/invitations/${token}/${action}`;
  }, [token, action]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-white text-lg font-semibold">Processing your invitation...</p>
        <p className="text-white/50 text-sm">Please wait a moment.</p>
      </div>
    </div>
  );
}
