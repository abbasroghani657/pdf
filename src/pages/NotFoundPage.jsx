import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <iconify-icon icon="solar:ghost-broken" class="text-5xl text-gray-400"></iconify-icon>
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">404 - Page Not Found</h1>
      <p className="text-base sm:text-lg text-gray-500 max-w-md mx-auto mb-8">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="bg-[#378ADD] hover:bg-[#2b71b8] text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
      >
        Go back to Homepage
      </button>
    </div>
  );
}
