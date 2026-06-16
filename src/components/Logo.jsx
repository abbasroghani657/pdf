import React from 'react';
import { clsx } from 'clsx';

export default function Logo({ className = '', hideText = false, size = 'md', invert = false }) {
  const iconSize = size === 'sm' ? 22 : 28;
  const textSize = size === 'sm' ? 'text-lg' : 'text-[22px]';

  return (
    <div className={clsx("flex items-center gap-1.5 shrink-0", className)}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm shrink-0">
        <path d="M14 2H6C4.8954 2 4 2.8954 4 4V20C4 21.1046 4.8954 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 16.5C12 16.5 15.5 13.5 15.5 11C15.5 9.6193 14.3807 8.5 13 8.5C12.5 8.5 12.2 8.7 12 9C11.8 8.7 11.5 8.5 11 8.5C9.6193 8.5 8.5 9.6193 8.5 11C8.5 13.5 12 16.5 12 16.5Z" fill="#378ADD"/>
      </svg>
      {!hideText && (
        <span className={clsx("font-bold tracking-tight whitespace-nowrap", textSize)}>
          <span className={invert ? "text-white" : "text-[#333333]"}>TheyLove</span><span className="text-[#378ADD]">PDF</span>
        </span>
      )}
    </div>
  );
}
