import React, { useState } from 'react';
import { clsx } from 'clsx';

const TICKETS = [
  { id: 'T-089', user: 'sara@hot.com', subject: 'Payment not working on Stripe', plan: 'Pro', time: '1h ago', status: 'Open', priority: 'High', color: 'red' },
  { id: 'T-088', user: 'ali@gm.com', subject: 'OCR failed my Arabic PDF', plan: 'Free', time: '3h ago', status: 'Open', priority: 'Medium', color: 'amber' },
  { id: 'T-087', user: 'john@out.com', subject: 'How to use Translate API?', plan: 'Business', time: '5h ago', status: 'Open', priority: 'Low', color: 'blue' },
  { id: 'T-086', user: 'raza@gm.com', subject: 'Refund requested', plan: 'Pro', time: '1d ago', status: 'Closed', priority: 'High', color: 'gray' },
  { id: 'T-085', user: 'maria@gm.com', subject: 'Account deletion', plan: 'Free', time: '2d ago', status: 'Closed', priority: 'Low', color: 'gray' },
];

export default function AdminSupport() {
  const [activeTicket, setActiveTicket] = useState(TICKETS[0]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row gap-6">
      {/* TICKET LIST */}
      <div className="w-full sm:w-1/3 md:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Support Tickets</h2>
          <div className="relative">
            <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></iconify-icon>
            <input 
              type="text" 
              placeholder="Search ID, email, subject..." 
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:ring-[#378ADD] focus:bg-white"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto custom-scrollbar pb-1">
            <button className="px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-full shrink-0">All Open (3)</button>
            <button className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-full shrink-0">Pro Only</button>
            <button className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-full shrink-0">Closed</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {TICKETS.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className={clsx(
                "p-4 border-b border-gray-50 cursor-pointer transition-colors",
                activeTicket?.id === ticket.id ? "bg-blue-50/50 border-l-4 border-l-[#378ADD]" : "hover:bg-gray-50 border-l-4 border-l-transparent"
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-gray-500">{ticket.id}</span>
                <span className={clsx(
                  "w-2 h-2 rounded-full",
                  ticket.color === 'red' ? 'bg-red-500' :
                  ticket.color === 'amber' ? 'bg-amber-500' :
                  ticket.color === 'blue' ? 'bg-[#378ADD]' : 'bg-gray-400'
                )}></span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{ticket.subject}</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate pr-2">{ticket.user}</span>
                <span className="text-gray-400 shrink-0">{ticket.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TICKET DETAIL */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {activeTicket ? (
          <>
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{activeTicket.subject}</h2>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded uppercase">{activeTicket.id}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-700">{activeTicket.user}</span>
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                    activeTicket.plan === 'Pro' ? 'bg-purple-100 text-purple-700' :
                    activeTicket.plan === 'Business' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                  )}>{activeTicket.plan}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 shadow-sm">View User</button>
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 shadow-sm">Check Payments</button>
                {activeTicket.status === 'Open' ? (
                  <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200">Mark Closed</button>
                ) : (
                  <button className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200">Reopen</button>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/30">
              {/* User Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#378ADD] font-bold flex items-center justify-center shrink-0">
                  {activeTicket.user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{activeTicket.user}</span>
                    <span className="text-xs text-gray-400">{activeTicket.time}</span>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700">
                    <p>Hi team,</p>
                    <p className="mt-2">I am trying to upgrade to Pro but my credit card keeps getting declined on the Stripe checkout page. Can you please check if my account is blocked?</p>
                    <p className="mt-2">Thanks.</p>
                  </div>
                </div>
              </div>

              {/* Admin Reply (if closed) */}
              {activeTicket.status === 'Closed' && (
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0">
                    Z
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                      <span className="font-bold text-gray-900">Zaheer A.</span>
                      <span className="text-xs text-gray-400">12h ago</span>
                    </div>
                    <div className="p-4 bg-[#378ADD] border border-blue-600 rounded-2xl rounded-tr-none shadow-sm text-sm text-white">
                      <p>Hello,</p>
                      <p className="mt-2">I have checked your account and everything looks fine on our end. The decline is coming directly from your bank. Please contact your bank to authorize international transactions, or try using PayPal/JazzCash.</p>
                      <p className="mt-2">Best regards,<br/>Zaheer</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reply Box */}
            {activeTicket.status === 'Open' && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <select className="text-xs border-none bg-gray-100 text-gray-600 rounded px-2 py-1 focus:ring-0 cursor-pointer font-semibold">
                    <option>Select Canned Response...</option>
                    <option>Payment Issue - Bank Decline</option>
                    <option>How to upgrade</option>
                    <option>Apology for bug</option>
                  </select>
                </div>
                <textarea 
                  rows="4" 
                  placeholder="Type your reply here..." 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-[#378ADD] focus:border-[#378ADD] resize-none"
                ></textarea>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2 text-gray-400">
                    <button className="p-1 hover:text-gray-600"><iconify-icon icon="solar:paperclip-linear" class="text-lg"></iconify-icon></button>
                    <button className="p-1 hover:text-gray-600"><iconify-icon icon="solar:text-bold" class="text-lg"></iconify-icon></button>
                  </div>
                  <button className="px-6 py-2 bg-[#378ADD] text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-2">
                    Send Reply <iconify-icon icon="solar:plain-2-bold"></iconify-icon>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <iconify-icon icon="solar:inbox-line-duotone" class="text-6xl mb-4 opacity-50"></iconify-icon>
            <p className="font-semibold">Select a ticket to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
