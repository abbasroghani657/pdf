import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const STATES = {
  accepted: {
    icon: '🎉',
    title: 'Invitation Accepted!',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    textColor: 'text-emerald-800',
    getMessage: (role) => {
      const roleLabel = role === 'superadmin' ? 'Super Admin' : 'Admin';
      return `Your role has been updated to ${roleLabel}. You can now access the Admin Panel and manage the platform.`;
    },
    cta: { label: 'Open Admin Panel', to: '/admin' },
  },
  declined: {
    icon: '👋',
    title: 'Invitation Declined',
    color: 'from-slate-500 to-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    textColor: 'text-gray-700',
    getMessage: () => 'You have declined the admin invitation. No changes have been made to your account.',
    cta: { label: 'Go to Home', to: '/' },
  },
  expired: {
    icon: '⏰',
    title: 'Invitation Expired',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-800',
    getMessage: () => 'This invitation link has expired (links are valid for 48 hours). Please ask the Super Admin to send a new invitation.',
    cta: { label: 'Go to Home', to: '/' },
  },
  already_accepted: {
    icon: '✅',
    title: 'Already Accepted',
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    textColor: 'text-blue-800',
    getMessage: () => 'This invitation has already been accepted. Your role is already updated.',
    cta: { label: 'Open Admin Panel', to: '/admin' },
  },
  invalid: {
    icon: '❌',
    title: 'Invalid Invitation',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    textColor: 'text-red-800',
    getMessage: () => 'This invitation link is invalid or does not exist. Please check the link and try again.',
    cta: { label: 'Go to Home', to: '/' },
  },
  error: {
    icon: '⚠️',
    title: 'Something Went Wrong',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    textColor: 'text-red-800',
    getMessage: () => 'An unexpected error occurred. Please contact support if the issue persists.',
    cta: { label: 'Go to Home', to: '/' },
  },
};

export default function InviteResponse() {
  const [searchParams] = useSearchParams();
  const statusKey = searchParams.get('status') || 'error';
  const role = searchParams.get('role') || 'admin';

  // Special case: "accepted" status can appear with a role
  const resolvedKey = statusKey === 'accepted' && role ? 'accepted' : statusKey;
  const state = STATES[resolvedKey] || STATES.error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Gradient header */}
          <div className={`bg-gradient-to-r ${state.color} p-8 text-center`}>
            <div className="text-5xl mb-3">{state.icon}</div>
            <h1 className="text-white text-2xl font-bold">{state.title}</h1>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            <div className={`${state.bg} border ${state.border} rounded-xl p-4`}>
              <p className={`${state.textColor} text-sm leading-relaxed`}>
                {state.getMessage(role)}
              </p>
            </div>

            {statusKey === 'accepted' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
                <p className="text-purple-800 text-sm font-semibold">What can you do now?</p>
                <ul className="text-purple-700 text-sm space-y-1 list-disc list-inside">
                  {role === 'superadmin' ? (
                    <>
                      <li>Manage all users and their roles</li>
                      <li>Configure platform settings</li>
                      <li>Set rate limits and security policies</li>
                      <li>View revenue, analytics, and reports</li>
                    </>
                  ) : (
                    <>
                      <li>Manage users (ban/unban, grant Pro)</li>
                      <li>View revenue and analytics</li>
                      <li>Handle support tickets</li>
                      <li>Monitor PDF jobs and tool usage</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            <Link
              to={state.cta.to}
              className="block w-full py-3 text-center bg-gradient-to-r from-[#378ADD] to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
            >
              {state.cta.label} →
            </Link>

            <p className="text-center text-xs text-gray-400">
              © {new Date().getFullYear()} TheyLovePDF · Secure Admin System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
