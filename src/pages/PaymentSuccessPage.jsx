import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }

    // Give Stripe webhook 2 seconds to process, then refresh user data
    const webhookDelay = setTimeout(async () => {
      try {
        await fetchUser(); // Refresh Pro status from DB
      } catch (e) {
        // Non-critical — user can still see success page
      }
    }, 2000);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(webhookDelay);
      clearInterval(timer);
    };
  }, [sessionId, navigate, fetchUser]);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#f8fafc]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white py-12 px-8 shadow-xl shadow-gray-200/50 sm:rounded-3xl border border-gray-100">
        
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-8 border-amber-50 mb-6 shadow-lg shadow-amber-200/50">
          <iconify-icon icon="solar:crown-bold" class="text-5xl text-white drop-shadow-md"></iconify-icon>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome to Pro!</h2>
        <p className="text-base text-gray-500 mb-4">
          Your payment was successful. You now have unlimited access to all PDFMaster premium features.
        </p>

        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 flex items-center justify-center gap-2">
          <iconify-icon icon="solar:check-circle-bold" class="text-xl text-emerald-500"></iconify-icon>
          <span className="text-sm font-semibold text-emerald-700">Payment confirmed by Stripe</span>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl mb-8 flex items-center justify-center gap-3">
          <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl text-[#378ADD]"></iconify-icon>
          <span className="text-sm font-semibold text-gray-600">Redirecting to your dashboard in {countdown}s...</span>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex justify-center w-full py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#378ADD] hover:bg-[#2b71b8] focus:outline-none transition-all"
        >
          Go to Dashboard Now
        </Link>
      </div>
    </div>
  );
}
