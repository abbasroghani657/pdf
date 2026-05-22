import React from 'react';

export default function PrivacyBadge() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs font-medium text-gray-500 bg-gray-50/80 py-2 px-4 rounded-full border border-gray-100 shadow-sm mx-auto w-max transition-all hover:bg-gray-50 hover:shadow">
      <iconify-icon icon="solar:shield-check-bold" class="text-emerald-500 text-base drop-shadow-sm"></iconify-icon>
      <span>
        <strong className="text-gray-700">End-to-End Encrypted.</strong> Files are permanently deleted after 2 hours.
      </span>
    </div>
  );
}
