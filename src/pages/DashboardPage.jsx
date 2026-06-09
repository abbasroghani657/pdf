import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const QUICK_TOOLS = [
  { label: 'Merge PDF', icon: 'solar:layers-bold', color: 'text-blue-600 bg-blue-50', path: '/tools/merge-pdf' },
  { label: 'Compress PDF', icon: 'solar:zip-file-bold', color: 'text-emerald-600 bg-emerald-50', path: '/tools/compress-pdf' },
  { label: 'Sign PDF', icon: 'solar:pen-bold', color: 'text-violet-600 bg-violet-50', path: '/tools/sign-pdf' },
  { label: 'PDF to Word', icon: 'solar:file-text-bold', color: 'text-indigo-600 bg-indigo-50', path: '/tools/pdf-to-word' },
  { label: 'OCR PDF', icon: 'solar:text-square-bold', color: 'text-teal-600 bg-teal-50', path: '/tools/ocr-pdf' },
  { label: 'Protect PDF', icon: 'solar:lock-password-bold', color: 'text-red-600 bg-red-50', path: '/tools/protect-pdf' },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];


export default function DashboardPage() {
  const { user, isPro, logout, upgradeToPro, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({ name: '', country: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState({ filesProcessed: '—', storageSaved: '—', recentTools: [] });
  
  // New States for Profile Tab
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error('New passwords do not match!');
    }
    setIsChangingPwd(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      toast.success(res.data.message || 'Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/auth/delete-account');
      toast.success('Account deleted successfully.');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    if (!user) navigate('/login');
    else {
      setEditForm({
        name: user.profile?.name || '',
        country: user.profile?.country || ''
      });
      // Fetch real usage stats
      api.get('/auth/stats').then(res => {
        if (res.data.success) {
          setUserStats({
            filesProcessed: res.data.filesProcessed,
            storageSaved: res.data.storageSaved,
            recentTools: res.data.recentTools || []
          });
        }
      }).catch(() => {}); // Silently fail — stats are non-critical
    }
  }, [user, navigate]);

  if (!user) return null;

  const profile = user.profile || {};
  const initials = (profile.name || user.email || 'U').slice(0, 2).toUpperCase();
  const planLabel = isPro ? 'Pro' : 'Free';
  const planColor = isPro ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Profile Header ─────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#378ADD] to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-200">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-xl font-extrabold text-gray-900">{profile.name || 'Welcome back!'}</h1>
              <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full border', planColor)}>
                {isPro ? '👑 Pro' : 'Free Plan'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{user.email}</p>
            {profile.country && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <iconify-icon icon="solar:global-linear" class="text-sm"></iconify-icon>
                {profile.country}
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-2 sm:mt-0">
            {!isPro && (
              <button
                onClick={upgradeToPro}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-amber-200 hover:-translate-y-px"
              >
                <iconify-icon icon="solar:crown-bold" class="text-base"></iconify-icon>
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
            >
              <iconify-icon icon="solar:logout-2-linear" class="text-base"></iconify-icon>
              Logout
            </button>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Files Processed', value: userStats.filesProcessed, icon: 'solar:document-bold', color: 'bg-blue-500', sub: 'All time' },
            { label: 'Storage Saved', value: userStats.storageSaved, icon: 'solar:database-bold', color: 'bg-emerald-500', sub: 'Compressed' },
            { label: 'Current Plan', value: null, icon: 'solar:crown-bold', color: 'bg-amber-500', sub: 'Upgrade for more' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0', card.color)}>
                <iconify-icon icon={card.icon} class="text-2xl"></iconify-icon>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {card.label === 'Current Plan' ? (
                    <span className={isPro ? 'text-amber-500' : 'text-gray-700'}>{planLabel}</span>
                  ) : card.value}
                </p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-300">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
          {['overview', 'profile', 'billing'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all',
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB: Overview ──────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Tools */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <iconify-icon icon="solar:bolt-bold" class="text-amber-500 text-xl"></iconify-icon>
                Quick Tools
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {QUICK_TOOLS.map(tool => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-[#378ADD]/30 hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform', tool.color)}>
                      <iconify-icon icon={tool.icon} class="text-2xl"></iconify-icon>
                    </div>
                    <span className="text-xs font-bold text-gray-700 text-center leading-tight">{tool.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <Link to="/" className="text-sm font-semibold text-[#378ADD] hover:underline flex items-center gap-1">
                  View all 37+ tools
                  <iconify-icon icon="solar:arrow-right-linear" class="text-base"></iconify-icon>
                </Link>
              </div>
            </div>

            {/* Plan Card */}
            <div className={clsx(
              'rounded-3xl border p-6 flex flex-col',
              isPro
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 text-white'
                : 'bg-white border-gray-100 shadow-sm'
            )}>
              <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', isPro ? 'bg-white/20' : 'bg-amber-50')}>
                <iconify-icon icon="solar:crown-bold" class={clsx('text-2xl', isPro ? 'text-white' : 'text-amber-500')}></iconify-icon>
              </div>
              <h3 className={clsx('text-lg font-extrabold mb-1', isPro ? 'text-white' : 'text-gray-900')}>
                {isPro ? 'You are on Pro! 🎉' : 'Upgrade to Pro'}
              </h3>
              <p className={clsx('text-sm mb-5 leading-relaxed', isPro ? 'text-white/80' : 'text-gray-500')}>
                {isPro
                  ? 'Enjoy unlimited file sizes, priority processing and all premium tools.'
                  : 'Remove 10MB limit, get 1GB uploads, priority queue and all AI tools.'}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  isPro ? '✅ Up to 1GB file uploads' : '❌ 10MB file limit',
                  isPro ? '✅ Priority processing queue' : '❌ Standard queue',
                  isPro ? '✅ All AI tools unlocked' : '❌ AI tools locked',
                  isPro ? '✅ Email support' : '❌ Community support only',
                ].map((item, i) => (
                  <li key={i} className={clsx('text-xs font-semibold', isPro ? 'text-white/90' : 'text-gray-600')}>
                    {item}
                  </li>
                ))}
              </ul>
              {!isPro && (
                <button
                  onClick={upgradeToPro}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-200 hover:-translate-y-0.5"
                >
                  Upgrade — $4.99/mo
                </button>
              )}
              {isPro && (
                <div className="text-xs text-white/70 text-center font-semibold mt-auto">
                  Next billing: Active subscription
                </div>
              )}
            </div>
            {/* ── Recent Activity ──────────────────────────────────────── */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <iconify-icon icon="solar:history-bold" class="text-[#378ADD] text-xl"></iconify-icon>
                Recently Used Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {userStats.recentTools && userStats.recentTools.length > 0 ? (
                  userStats.recentTools.map((act, i) => {
                    const matchedTool = QUICK_TOOLS.find(t => t.path.includes(act.name.toLowerCase().replace('_', '-'))) 
                      || { label: act.name.replace(/-/g, ' ').toUpperCase(), icon: 'solar:widget-bold', color: 'text-gray-600 bg-gray-50', path: `/tools/${act.name}` };
                    
                    const timeAgo = (dateStr) => {
                      const diff = new Date() - new Date(dateStr);
                      const minutes = Math.floor(diff / 60000);
                      if (minutes < 60) return `${minutes || 1} mins ago`;
                      const hours = Math.floor(minutes / 60);
                      if (hours < 24) return `${hours} hours ago`;
                      return `${Math.floor(hours / 24)} days ago`;
                    };

                    return (
                      <Link key={i} to={matchedTool.path} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer">
                        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', matchedTool.color)}>
                          <iconify-icon icon={matchedTool.icon} class="text-xl"></iconify-icon>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{matchedTool.label}</p>
                          <p className="text-xs text-gray-500">{timeAgo(act.time)}</p>
                        </div>
                        <iconify-icon icon="solar:alt-arrow-right-linear" class="text-gray-400"></iconify-icon>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-3 py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <iconify-icon icon="solar:ghost-smile-bold" class="text-4xl opacity-50"></iconify-icon>
                    <p className="text-sm font-semibold">No recent activity</p>
                    <p className="text-xs text-gray-400">Tools you use will show up here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Profile ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-extrabold text-gray-900">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#378ADD] border border-[#378ADD]/30 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <iconify-icon icon="solar:pen-linear" class="text-base"></iconify-icon>
                  Edit Profile
                </button>
              )}
            </div>

            {/* Read-only fields (email, role, member since) */}
            <div className="space-y-3 mb-5">
              {[
                { label: 'Email Address', value: user.email, icon: 'solar:letter-linear' },
                { label: 'Account Role', value: profile.role || 'user', icon: 'solar:shield-user-linear' },
                { label: 'Member Since', value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: 'solar:calendar-linear' },
              ].map((field, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                    <iconify-icon icon={field.icon} class="text-lg"></iconify-icon>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{field.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 capitalize">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Editable fields */}
            {isEditing ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSaving(true);
                  try {
                    await updateProfile(editForm);
                    setIsEditing(false);
                  } catch(error) {
                    toast.error(error.message || 'Failed to update profile');
                  }
                  finally { setIsSaving(false); }
                }}
                className="space-y-4 border-t border-gray-100 pt-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <iconify-icon icon="solar:user-linear" class="text-lg"></iconify-icon>
                    </div>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(p => ({...p, name: e.target.value}))}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <iconify-icon icon="solar:global-linear" class="text-lg"></iconify-icon>
                    </div>
                    <select
                      value={editForm.country}
                      onChange={e => setEditForm(p => ({...p, country: e.target.value}))}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-colors appearance-none bg-white"
                    >
                      <option value="" disabled>Select your country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
                      <iconify-icon icon="solar:alt-arrow-down-linear" class="text-lg"></iconify-icon>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[#378ADD] hover:bg-[#2b71b8] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSaving
                      ? <iconify-icon icon="line-md:loading-twotone-loop" class="text-lg"></iconify-icon>
                      : <><iconify-icon icon="solar:check-circle-bold" class="text-base"></iconify-icon> Save Changes</>
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setEditForm({ name: profile.name || '', country: profile.country || '' }); }}
                    className="px-5 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 border-t border-gray-100 pt-5">
                {[
                  { label: 'Full Name', value: profile.name || '—', icon: 'solar:user-linear' },
                  { label: 'Country', value: profile.country || 'Not set', icon: 'solar:global-linear' },
                ].map((field, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <iconify-icon icon={field.icon} class="text-lg"></iconify-icon>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{field.label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Change Password Section ────────────────────────────── */}
            {user?.profile?.auth_provider === 'email' && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <iconify-icon icon="solar:lock-password-bold" class="text-gray-400"></iconify-icon>
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        required
                        value={pwdForm.currentPassword}
                        onChange={e => setPwdForm(p => ({...p, currentPassword: e.target.value}))}
                        className="w-full px-3 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-colors"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <iconify-icon icon={showPwd ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg"></iconify-icon>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          required
                          minLength={8}
                          value={pwdForm.newPassword}
                          onChange={e => setPwdForm(p => ({...p, newPassword: e.target.value}))}
                          className="w-full px-3 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-colors"
                          placeholder="At least 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <iconify-icon icon={showPwd ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg"></iconify-icon>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          required
                          minLength={8}
                          value={pwdForm.confirmPassword}
                          onChange={e => setPwdForm(p => ({...p, confirmPassword: e.target.value}))}
                          className="w-full px-3 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#378ADD]/20 focus:border-[#378ADD] transition-colors"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <iconify-icon icon={showPwd ? 'solar:eye-closed-linear' : 'solar:eye-linear'} class="text-lg"></iconify-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingPwd || !pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword}
                    className="py-2.5 px-5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isChangingPwd ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Danger Zone ─────────────────────────────────────────── */}
            <div className="mt-8 border-t border-red-100 pt-8">
              <h3 className="text-base font-extrabold text-red-600 mb-2 flex items-center gap-2">
                <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500"></iconify-icon>
                Danger Zone
              </h3>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-red-900 text-sm">Delete Account</p>
                  <p className="text-xs text-red-700 mt-1 max-w-sm">
                    Permanently remove your account and all associated data. This action is irreversible.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className="shrink-0 px-4 py-2.5 bg-white text-red-600 border border-red-200 font-bold rounded-xl text-sm hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>

            {/* ── Delete Confirmation Modal ───────────────────────────── */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <iconify-icon icon="solar:danger-triangle-bold" class="text-2xl"></iconify-icon>
                    </div>
                    <h3 className="text-xl font-black">Delete Account?</h3>
                  </div>
                  
                  <div className="space-y-3 mb-6 text-sm text-gray-600">
                    <p>This action is <strong>permanent</strong> and cannot be undone.</p>
                    <ul className="space-y-1 list-disc pl-5">
                      <li>All your files and processing history will be deleted.</li>
                      <li>Your subscription will be immediately cancelled.</li>
                      <li>You will lose access to all Pro features.</li>
                    </ul>
                    <p className="pt-2 text-gray-800 font-medium">Please type <strong>DELETE</strong> to confirm.</p>
                  </div>
                  
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }}
                      className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteInput !== 'DELETE' || isDeleting}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── TAB: Billing ───────────────────────────────────────────── */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 max-w-2xl">
            <h2 className="text-base font-extrabold text-gray-900 mb-6">Billing & Subscription</h2>
            <div className={clsx(
              'rounded-2xl p-5 mb-6 flex items-center gap-4',
              isPro ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'
            )}>
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', isPro ? 'bg-amber-100' : 'bg-gray-100')}>
                <iconify-icon icon="solar:crown-bold" class={clsx('text-2xl', isPro ? 'text-amber-500' : 'text-gray-400')}></iconify-icon>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{isPro ? 'PDFMaster Pro' : 'PDFMaster Free'}</p>
                <p className="text-sm text-gray-500">
                  {isPro
                    ? user?.profile?.plan === 'Pro Annual'
                      ? '$47.88/year · Active'
                      : '$4.99/month · Active'
                    : 'No active subscription'
                  }
                </p>
                {isPro && user?.profile?.pro_expires_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Renews: {new Date(user.profile.pro_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {isPro ? (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Active</span>
              ) : (
                <button onClick={upgradeToPro} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors">
                  Upgrade
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">What's included:</h3>
              {[
                { feature: 'File Size Limit', free: '10 MB', pro: '1 GB' },
                { feature: 'Processing Queue', free: 'Standard', pro: 'Priority' },
                { feature: 'AI Tools (Chat, OCR, Translate)', free: '❌ Locked', pro: '✅ Unlimited' },
                { feature: 'Support', free: 'Community', pro: 'Email Priority' },
                { feature: 'Ads', free: 'Yes', pro: 'No Ads' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 text-sm p-3 rounded-xl bg-gray-50">
                  <span className="font-semibold text-gray-700">{row.feature}</span>
                  <span className="text-gray-500 text-center">{row.free}</span>
                  <span className={clsx('text-center font-semibold', isPro ? 'text-emerald-600' : 'text-gray-700')}>{row.pro}</span>
                </div>
              ))}
            </div>

            {!isPro && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Payment processing via Stripe (coming soon). All transactions are secure and encrypted.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
