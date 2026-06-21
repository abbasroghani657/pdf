import React from 'react';

export default function PrivacyBadge({ lang = 'en' }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-6 text-[10px] sm:text-xs font-medium text-gray-500 bg-gray-50/80 py-2.5 px-4 rounded-xl sm:rounded-full border border-gray-100 shadow-sm mx-auto w-full sm:w-max max-w-full transition-all hover:bg-gray-50 hover:shadow text-center">
      <iconify-icon icon="solar:shield-check-bold" class="text-emerald-500 text-sm sm:text-base drop-shadow-sm"></iconify-icon>
      <span className="leading-tight">
        {lang === 'es' ? (
          <><strong className="text-gray-700">Cifrado de extremo a extremo.</strong> Los archivos se eliminan permanentemente después de 2 horas.</>
        ) : (
          <><strong className="text-gray-700">End-to-End Encrypted.</strong> Files are permanently deleted after 2 hours.</>
        )}
      </span>
    </div>
  );
}
