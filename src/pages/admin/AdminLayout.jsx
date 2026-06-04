import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_MENU = [
  { path: '/admin', icon: 'solar:pie-chart-2-bold', label: 'Dashboard' },
  { path: '/admin/users', icon: 'solar:users-group-rounded-bold', label: 'Users' },
  { path: '/admin/revenue', icon: 'solar:wallet-money-bold', label: 'Revenue' },
  { path: '/admin/jobs', icon: 'solar:document-text-bold', label: 'PDF Jobs' },
  { path: '/admin/tools', icon: 'solar:box-bold', label: 'Tools Control' },
  { path: '/admin/analytics', icon: 'solar:graph-bold', label: 'Analytics' },
  { path: '/admin/settings', icon: 'solar:settings-bold', label: 'Settings' },
  { path: '/admin/security', icon: 'solar:shield-warning-bold', label: 'Security' },
  { path: '/admin/emails', icon: 'solar:letter-bold', label: 'Emails' },
  { path: '/admin/support', icon: 'solar:chat-square-call-bold', label: 'Support' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin access guard — wait for user to fully load before checking
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
    } else if (user?.profile && !['admin', 'superadmin'].includes(user.profile.role)) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const initials = user?.profile?.name
    ? user.profile.name.slice(0, 2).toUpperCase()
    : (user?.email?.[0] || 'A').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed md:sticky top-0 left-0 z-50 w-64 h-screen bg-[#1e293b] text-white flex flex-col transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#378ADD] to-[#8b5cf6] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">P</div>
            <span className="font-bold text-lg tracking-tight">Admin<span className="text-[#378ADD]">Panel</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <iconify-icon icon="solar:close-circle-bold" class="text-2xl"></iconify-icon>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          {ADMIN_MENU.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group",
                  isActive 
                    ? "bg-[#378ADD] text-white shadow-md shadow-blue-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <iconify-icon icon={item.icon} class={clsx("text-lg", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")}></iconify-icon>
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Real user info at bottom */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#378ADD] to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.profile?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.profile?.role || 'admin'}</p>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              <iconify-icon icon="solar:logout-2-outline" class="text-lg"></iconify-icon>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-900"
            >
              <iconify-icon icon="solar:hamburger-menu-linear" class="text-2xl"></iconify-icon>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 font-medium">
              <iconify-icon icon="solar:calendar-bold" class="text-[#378ADD]"></iconify-icon>
              Today: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <iconify-icon icon="solar:bell-bing-bold" class="text-xl"></iconify-icon>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <a href="/" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors">
              View Site
              <iconify-icon icon="solar:square-top-down-linear"></iconify-icon>
            </a>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
