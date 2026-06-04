import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminSupport() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [filterStatus, setFilterStatus] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/support/tickets');
      if (res.data.success) {
        setTickets(res.data.tickets);
        if (res.data.tickets.length > 0 && !activeTicket) {
          setActiveTicket(res.data.tickets[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load support tickets. Run the database SQL script.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async (ticketId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      await api.put(`/admin/support/tickets/${ticketId}`, { status: newStatus });
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (activeTicket?.id === ticketId) {
        setActiveTicket(prev => ({ ...prev, status: newStatus }));
      }
      toast.success(`Ticket ${newStatus === 'closed' ? 'closed' : 'reopened'}`);
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    try {
      await api.post(`/admin/support/tickets/${activeTicket.id}/reply`, { message: reply });
      toast.success('Reply sent!');
      // Update the active ticket locally to show the reply without closing
      const updatedTicket = { ...activeTicket, admin_reply: reply, replied_at: new Date().toISOString() };
      setActiveTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === activeTicket.id ? updatedTicket : t));
      setReply('');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'open'
      ? (t.status === 'open' || t.status === 'pending')
      : filterStatus === 'closed'
      ? (t.status === 'closed' || t.status === 'resolved')
      : true;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (t.subject || '').toLowerCase().includes(q) ||
      (t.user_email || '').toLowerCase().includes(q) ||
      (t.message || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;

  const getPriorityColor = (priority) => {
    if (priority === 'high' || priority === 'urgent') return 'bg-red-500';
    if (priority === 'medium') return 'bg-amber-500';
    return 'bg-blue-400';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row gap-6">
      {/* TICKET LIST */}
      <div className="w-full sm:w-1/3 md:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Support Tickets</h2>
            <button 
              onClick={fetchTickets}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-[#378ADD] transition-colors rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              <iconify-icon icon={loading ? "line-md:loading-twotone-loop" : "solar:refresh-linear"} class="text-lg"></iconify-icon>
            </button>
          </div>
          <div className="relative">
            <iconify-icon icon="solar:magnifer-linear" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></iconify-icon>
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:ring-[#378ADD] focus:bg-white"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto custom-scrollbar pb-1">
            <button 
              onClick={() => setFilterStatus('open')}
              className={clsx("px-3 py-1 text-xs font-bold rounded-full shrink-0 transition-colors", 
                filterStatus === 'open' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              All Open ({openCount})
            </button>
            <button 
              onClick={() => setFilterStatus('all')}
              className={clsx("px-3 py-1 text-xs font-bold rounded-full shrink-0 transition-colors",
                filterStatus === 'all' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setFilterStatus('closed')}
              className={clsx("px-3 py-1 text-xs font-bold rounded-full shrink-0 transition-colors",
                filterStatus === 'closed' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Closed
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="py-10 text-center text-gray-500">
              <iconify-icon icon="line-md:loading-twotone-loop" class="text-3xl text-[#378ADD]"></iconify-icon>
              <p className="mt-2 text-sm">Loading tickets...</p>
            </div>
          )}
          {!loading && filteredTickets.length === 0 && (
            <div className="py-10 text-center text-gray-500">
              <iconify-icon icon="solar:inbox-line-duotone" class="text-4xl opacity-40"></iconify-icon>
              <p className="mt-2 text-sm">No tickets found.</p>
            </div>
          )}
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className={clsx(
                "p-4 border-b border-gray-50 cursor-pointer transition-colors",
                activeTicket?.id === ticket.id ? "bg-blue-50/50 border-l-4 border-l-[#378ADD]" : "hover:bg-gray-50 border-l-4 border-l-transparent"
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-gray-500">#{String(ticket.id).slice(0,8)}</span>
                <span className={clsx("w-2 h-2 rounded-full shrink-0 mt-1", getPriorityColor(ticket.priority))}></span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{ticket.subject}</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate pr-2">{ticket.user_email}</span>
                <span className="text-gray-400 shrink-0">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                  ticket.status === 'open' || ticket.status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {ticket.status}
                </span>
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
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded uppercase">
                    #{String(activeTicket.id).slice(0,8)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-700">{activeTicket.user_email}</span>
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                    activeTicket.category === 'billing' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {activeTicket.category || 'General'}
                  </span>
                  <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                    activeTicket.status === 'open' || activeTicket.status === 'pending' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {activeTicket.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 shadow-sm">View User</button>
                {(activeTicket.status === 'open' || activeTicket.status === 'pending') ? (
                  <button 
                    onClick={() => handleCloseTicket(activeTicket.id, activeTicket.status)}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200"
                  >
                    Mark Closed
                  </button>
                ) : (
                  <button 
                    onClick={() => handleCloseTicket(activeTicket.id, activeTicket.status)}
                    className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/30">
              {/* User Original Message */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#378ADD] font-bold flex items-center justify-center shrink-0">
                  {(activeTicket.user_email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{activeTicket.user_email}</span>
                    <span className="text-xs text-gray-400">{new Date(activeTicket.created_at).toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700">
                    <p>{activeTicket.message}</p>
                  </div>
                </div>
              </div>

              {/* Admin Reply - if exists */}
              {activeTicket.admin_reply && (
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0">
                    A
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                      <span className="font-bold text-gray-900">Admin</span>
                      <span className="text-xs text-gray-400">{new Date(activeTicket.replied_at || activeTicket.updated_at).toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-[#378ADD] border border-blue-600 rounded-2xl rounded-tr-none shadow-sm text-sm text-white max-w-xl">
                      <p>{activeTicket.admin_reply}</p>
                    </div>
                  </div>
                </div>
              )}

              {!activeTicket.admin_reply && (
                <div className="text-center text-sm text-gray-400 py-4">
                  <iconify-icon icon="solar:chat-dots-linear" class="text-2xl mb-1"></iconify-icon>
                  <p>No replies yet. Be the first to respond.</p>
                </div>
              )}
            </div>

            {/* Reply Box */}
            {(activeTicket.status === 'open' || activeTicket.status === 'pending') && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <select 
                    onChange={(e) => setReply(e.target.value)}
                    className="text-xs border-none bg-gray-100 text-gray-600 rounded px-2 py-1 focus:ring-0 cursor-pointer font-semibold"
                  >
                    <option value="">Select Canned Response...</option>
                    <option value="Hi there! Thank you for reaching out. I have checked your account and everything looks good on our end. Please try clearing your browser cache and trying again. Let us know if the issue persists.">Payment Issue - Bank Decline</option>
                    <option value="Hi! To upgrade to Pro, go to Settings → Subscription, then click Upgrade to Pro. You can pay securely via Stripe. Let us know if you need help.">How to upgrade</option>
                    <option value="Hi, we sincerely apologize for the inconvenience. Our team is aware of this issue and is working on a fix. We will notify you as soon as it is resolved.">Apology for bug</option>
                  </select>
                </div>
                <textarea 
                  rows="4" 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply here..." 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-[#378ADD] focus:border-[#378ADD] resize-none"
                ></textarea>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2 text-gray-400">
                    <button className="p-1 hover:text-gray-600"><iconify-icon icon="solar:paperclip-linear" class="text-lg"></iconify-icon></button>
                  </div>
                  <button 
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                    className="px-6 py-2 bg-[#378ADD] text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Reply <iconify-icon icon="solar:plain-2-bold"></iconify-icon>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <iconify-icon icon="solar:inbox-line-duotone" class="text-6xl mb-4 opacity-50"></iconify-icon>
            <p className="font-semibold">
              {loading ? 'Loading tickets...' : 'Select a ticket to view details'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
