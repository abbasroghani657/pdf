import React from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UpgradeModal({ isOpen, onClose, featureName, limitMessage }) {
  const { upgradeToPro } = useAuth();
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-4 right-4">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <iconify-icon icon="solar:close-circle-bold" class="text-xl"></iconify-icon>
          </button>
        </div>

        <div className="p-8 pb-6 text-center border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
          <div className="w-20 h-20 mx-auto bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner mb-6 rotate-3">
            <iconify-icon icon="solar:crown-star-bold" class="text-4xl drop-shadow-sm"></iconify-icon>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Upgrade to Pro</h2>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            {limitMessage || `You've reached the free limit for ${featureName}. Upgrade to Pro for unlimited access.`}
          </p>
        </div>

        <div className="p-6 bg-gray-50/50">
          <ul className="space-y-4 mb-8">
            {[
              'Unlimited file size (Up to 2GB)',
              'Batch processing (Up to 50 files)',
              'Ultra-fast priority servers',
              'Advanced OCR & Signature features',
              'No ads, completely distraction-free'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <iconify-icon icon="solar:check-circle-bold" class="text-indigo-500 text-lg shrink-0"></iconify-icon>
                {feature}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <button 
              onClick={() => {
                onClose();
                navigate('/pricing');
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Get TheyLovePDF Pro
            </button>
            <p className="text-xs text-center text-gray-400 font-medium">Starting at just $4.99/month. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
