import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export default function MockCheckoutPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan') || 'monthly';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/25');
  const [cvc, setCvc] = useState('123');

  useEffect(() => {
    if (!user || !sessionId) {
      navigate('/dashboard');
    }
  }, [user, sessionId, navigate]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Simulate network delay to feel like a real payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await api.post('/payments/mock-webhook', { plan });
      if (res.data.success) {
        navigate(`/payment-success?session_id=${sessionId}`);
      } else {
        throw new Error('Payment failed on server');
      }
    } catch (error) {
      console.error(error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#1e293b] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-indigo-500/20 blur-xl"></div>
          
          <div className="flex justify-center mb-4 relative z-10">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-bold text-xl text-[#1e293b]">P</span>
            </div>
          </div>
          <h2 className="text-xl font-bold relative z-10">TheyLovePDF Payment System</h2>
          <p className="text-sm text-slate-300 mt-1 relative z-10">Development Testing Gateway</p>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Subscription</p>
              <p className="text-lg font-extrabold text-gray-900 mt-1">TheyLovePDF Pro</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Amount</p>
              <p className="text-2xl font-extrabold text-[#378ADD] mt-1">{plan === 'annual' ? '$47.88' : '$4.99'}<span className="text-sm text-gray-500 font-medium">{plan === 'annual' ? '/yr' : '/mo'}</span></p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
            <iconify-icon icon="solar:info-circle-bold" class="text-xl shrink-0 mt-0.5 text-amber-500"></iconify-icon>
            <p className="font-medium">
              This is a test payment environment. No real money will be charged. Click "Pay Now" to simulate a successful transaction.
            </p>
          </div>

          <form onSubmit={handlePayment} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Information</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <iconify-icon icon="solar:card-linear" class="text-gray-400 text-lg"></iconify-icon>
                </div>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-t-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#378ADD] focus:border-[#378ADD] bg-gray-50 text-gray-600 font-mono"
                  placeholder="Card number"
                />
              </div>
              <div className="flex">
                <div className="relative w-1/2">
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-3 border border-t-0 border-r-0 border-gray-200 rounded-bl-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#378ADD] focus:border-[#378ADD] bg-gray-50 text-gray-600 font-mono"
                    placeholder="MM/YY"
                  />
                </div>
                <div className="relative w-1/2">
                  <input 
                    type="text" 
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full px-3 py-3 border border-t-0 border-gray-200 rounded-br-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#378ADD] focus:border-[#378ADD] bg-gray-50 text-gray-600 font-mono"
                    placeholder="CVC"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cardholder Name</label>
              <input 
                type="text" 
                value={user.profile?.name || ''}
                readOnly
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#378ADD] hover:bg-[#2b71b8] focus:outline-none transition-all disabled:opacity-70 mt-4 relative overflow-hidden group"
            >
              {isProcessing ? (
                <iconify-icon icon="line-md:loading-twotone-loop" class="text-xl"></iconify-icon>
              ) : (
                <span className="flex items-center gap-2">
                  Pay {plan === 'annual' ? '$47.88' : '$4.99'}
                  <iconify-icon icon="solar:arrow-right-line-duotone" class="text-lg group-hover:translate-x-1 transition-transform"></iconify-icon>
                </span>
              )}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/dashboard" className="text-xs font-semibold text-gray-400 hover:text-gray-600">
                Cancel and return to TheyLovePDF
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
