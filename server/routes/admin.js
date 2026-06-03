const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, admin } = require('../middleware/auth');

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
router.get('/dashboard-stats', protect, admin, async (req, res) => {
  try {
    // 1. Total Users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 2. Pro Subscribers
    const { count: proUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro', true);

    // 3. New Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 4. Recent Signups (Last 5)
    const { data: recentSignups } = await supabase
      .from('users')
      .select('email, created_at, plan, country')
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Total Revenue & Graph Data (Real data from payments table)
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });
      
    const totalRevenue = paymentsData 
      ? paymentsData.reduce((acc, curr) => acc + Number(curr.amount), 0).toFixed(2) 
      : '0.00';

    const revenueMap = {};
    if (paymentsData) {
      paymentsData.forEach(p => {
        const date = new Date(p.created_at);
        const day = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getDate();
        revenueMap[day] = (revenueMap[day] || 0) + Number(p.amount);
      });
    }
    const revenueGraphData = Object.keys(revenueMap).map(key => ({
      name: key,
      value: Number(revenueMap[key].toFixed(2))
    })).slice(-14);

    // 6. Top Tools
    const { data: usageData } = await supabase.from('tool_usage').select('tool_id');
    const toolMap = {};
    if (usageData) {
      usageData.forEach(u => {
        // Humanize the slug e.g. "merge-pdf" -> "Merge PDF"
        const toolName = (u.tool_id || 'unknown').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        toolMap[toolName] = (toolMap[toolName] || 0) + 1;
      });
    }
    
    // If no tool usage data exists, return empty array
    const topToolsData = Object.keys(toolMap).length > 0 
      ? Object.keys(toolMap).map(key => ({ name: key, uses: toolMap[key] })).sort((a, b) => b.uses - a.uses).slice(0, 5)
      : [];

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        newToday: newToday || 0,
        totalRevenue: `$${totalRevenue}`,
      },
      revenueGraphData: revenueGraphData || [],
      topToolsData,
      recentSignups: recentSignups || []
    });
  } catch (error) {
    console.error('[Admin Analytics Error]:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('[Admin Users Error]:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// @desc    Ban / Unban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
router.put('/users/:id/ban', protect, admin, async (req, res) => {
  try {
    const { is_banned } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ is_banned: !!is_banned })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    console.error('[Admin Ban User Error]:', error);
    res.status(500).json({ message: 'Failed to update user ban status' });
  }
});

// @desc    Toggle Pro status of a user
// @route   PUT /api/admin/users/:id/pro
// @access  Private/Admin
router.put('/users/:id/pro', protect, admin, async (req, res) => {
  try {
    const { is_pro } = req.body;
    const plan = is_pro ? 'Pro' : 'Free';
    const { data, error } = await supabase
      .from('users')
      .update({ is_pro: !!is_pro, plan })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    console.error('[Admin Toggle Pro Error]:', error);
    res.status(500).json({ message: 'Failed to update user pro status' });
  }
});

// @desc    Get Revenue Data
// @route   GET /api/admin/revenue
// @access  Private/Admin
router.get('/revenue', protect, admin, async (req, res) => {
  try {
    const { count: totalProUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_pro', true);

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    let totalRevenue = 0;
    let revenueToday = 0;
    let revenueThisMonth = 0;

    payments.forEach(p => {
      const amt = Number(p.amount);
      totalRevenue += amt;
      
      const pDate = new Date(p.created_at);
      const pDateStr = pDate.toISOString().split('T')[0];
      const pMonthStr = pDate.getFullYear() + '-' + String(pDate.getMonth() + 1).padStart(2, '0');

      if (pDateStr === todayStr) revenueToday += amt;
      if (pMonthStr === thisMonthStr) revenueThisMonth += amt;
    });

    // Build MRR Data by grouping payments by month-year
    const mrrMap = {};
    payments.forEach(p => {
      const date = new Date(p.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear().toString().substr(-2);
      mrrMap[monthYear] = (mrrMap[monthYear] || 0) + Number(p.amount);
    });

    const mrrData = Object.keys(mrrMap).map(key => ({
      name: key,
      mrr: Number(mrrMap[key].toFixed(2))
    })).reverse();

    // Build Plan Distribution Data
    const planMap = {};
    payments.forEach(p => {
      const plan = p.plan || 'Unknown';
      planMap[plan] = (planMap[plan] || 0) + Number(p.amount);
    });

    const colors = ['#378ADD', '#8b5cf6', '#f59e0b', '#10b981'];
    let cIdx = 0;
    const planData = Object.keys(planMap).map(key => ({
      name: key,
      value: Number(planMap[key].toFixed(2)),
      color: colors[cIdx++ % colors.length]
    }));

    const transactions = payments.map(p => ({
      id: p.id,
      time: p.created_at,
      user: p.user_email,
      plan: p.plan,
      amount: `$${Number(p.amount).toFixed(2)}`,
      status: p.status === 'completed' ? 'Paid' : p.status,
      statusCls: p.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
    }));

    res.json({
      success: true,
      stats: {
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
        revenueToday: `$${revenueToday.toFixed(2)}`,
        revenueThisMonth: `$${revenueThisMonth.toFixed(2)}`,
        proUsersCount: totalProUsers || 0
      },
      mrrData,
      planData,
      transactions
    });
  } catch (error) {
    console.error('[Admin Revenue Error]:', error);
    res.status(500).json({ message: 'Failed to fetch revenue' });
  }
});

// @desc    Get PDF Jobs (Tool Usage)
// @route   GET /api/admin/jobs
// @access  Private/Admin
router.get('/jobs', protect, admin, async (req, res) => {
  try {
    const { data: usageLogs, error } = await supabase
      .from('tool_usage')
      .select('*, user:users(email)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get basic stats
    const today = new Date();
    today.setHours(0,0,0,0);

    const { count: doneToday } = await supabase
      .from('tool_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: errors } = await supabase
      .from('tool_usage')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');

    res.json({
      success: true,
      jobs: usageLogs || [],
      stats: {
        activeJobs: 0, // Since it's synchronous, usually 0
        queued: 0,
        doneToday: doneToday || 0,
        errors: errors || 0
      }
    });
  } catch (error) {
    console.error('[Admin Jobs Error]:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// @desc    Get Tools Config
// @route   GET /api/admin/tools
// @access  Private/Admin
router.get('/tools', protect, admin, async (req, res) => {
  try {
    const { data: tools, error } = await supabase
      .from('tools_config')
      .select('*')
      .order('name');
    if (error) throw error;
    res.json({ success: true, tools: tools || [] });
  } catch (error) {
    console.error('[Admin Tools Error]:', error);
    res.status(500).json({ message: 'Failed to fetch tools' });
  }
});

// @desc    Update Tool Config
// @route   PUT /api/admin/tools/:id
// @access  Private/Admin
router.put('/tools/:id', protect, admin, async (req, res) => {
  try {
    const { is_active, requires_pro, maintenance_mode } = req.body;
    const { data, error } = await supabase
      .from('tools_config')
      .update({ is_active, requires_pro, maintenance_mode })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json({ success: true, tool: data[0] });
  } catch (error) {
    console.error('[Admin Tools Update Error]:', error);
    res.status(500).json({ message: 'Failed to update tool' });
  }
});

// @desc    Get Security Logs
// @route   GET /api/admin/security/logs
// @access  Private/Admin
router.get('/security/logs', protect, admin, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    // Fetch banned users
    const { data: bannedUsers } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('is_banned', true);

    res.json({ success: true, logs: logs || [], bannedUsers: bannedUsers || [] });
  } catch (error) {
    console.error('[Admin Security Error]:', error);
    res.status(500).json({ message: 'Failed to fetch security logs' });
  }
});

// @desc    Get Support Tickets
// @route   GET /api/admin/support/tickets
// @access  Private/Admin
router.get('/support/tickets', protect, admin, async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, tickets: tickets || [] });
  } catch (error) {
    console.error('[Admin Support Error]:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// @desc    Update Support Ticket Status
// @route   PUT /api/admin/support/tickets/:id
// @access  Private/Admin
router.put('/support/tickets/:id', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json({ success: true, ticket: data[0] });
  } catch (error) {
    console.error('[Admin Ticket Update Error]:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

// @desc    Reply to Support Ticket
// @route   POST /api/admin/support/tickets/:id/reply
// @access  Private/Admin
router.post('/support/tickets/:id/reply', protect, admin, async (req, res) => {
  try {
    const { message } = req.body;
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        admin_reply: message,
        status: 'closed',
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json({ success: true, ticket: data[0] });
  } catch (error) {
    console.error('[Admin Ticket Reply Error]:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

// @desc    Get Platform Settings
// @route   GET /api/admin/settings
// @access  Private/Admin
router.get('/settings', protect, admin, async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*');
    if (error) throw error;
    res.json({ success: true, settings: settings || [] });
  } catch (error) {
    console.error('[Admin Settings Get Error]:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// @desc    Update Platform Settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const { settings } = req.body;
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase
        .from('platform_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    );
    await Promise.all(updates);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('[Admin Settings Update Error]:', error);
    res.status(500).json({ message: 'Failed to save settings' });
  }
});

// @desc    Get Analytics Data
// @route   GET /api/admin/analytics
// @access  Private/Admin
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: toolsCount } = await supabase.from('tool_usage').select('*', { count: 'exact', head: true });
    const { count: proUsersCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_pro', true);

    const stats = {
      visitors: (usersCount || 0) * 12,
      sessions: (toolsCount || 0) * 2,
      pageViews: (toolsCount || 0) * 5,
      newUsers: usersCount || 0
    };

    const funnelData = [
      { value: stats.visitors, name: 'Total Visitors', fill: '#e2e8f0' },
      { value: toolsCount || 0, name: 'Used a Tool', fill: '#bae6fd' },
      { value: usersCount || 0, name: 'Signed Up', fill: '#7dd3fc' },
      { value: proUsersCount || 0, name: 'Bought Pro', fill: '#0ea5e9' },
    ];

    // Traffic by day from tool_usage
    const { data: usageData } = await supabase.from('tool_usage').select('created_at');
    const trafficMap = {};
    if (usageData) {
      usageData.forEach(u => {
        const date = new Date(u.created_at);
        const day = date.toLocaleString('default', { weekday: 'short' });
        if (!trafficMap[day]) trafficMap[day] = { visits: 0, sessions: 0 };
        trafficMap[day].sessions += 1;
        trafficMap[day].visits += 2;
      });
    }
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trafficData = days.map(day => ({
      name: day,
      visits: trafficMap[day]?.visits || 0,
      sessions: trafficMap[day]?.sessions || 0
    }));

    // Real country breakdown from users table
    const { data: usersData } = await supabase.from('users').select('country');
    const countryMap = {};
    if (usersData) {
      usersData.forEach(u => {
        const country = u.country || 'Unknown';
        countryMap[country] = (countryMap[country] || 0) + 1;
      });
    }
    const total = usersData ? usersData.length : 0;
    const countryData = Object.entries(countryMap)
      .map(([country, count]) => ({
        country,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({ success: true, stats, funnelData, trafficData, countryData });
  } catch (error) {
    console.error('[Admin Analytics Error]:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// @desc    Get Email Campaigns & Templates
// @route   GET /api/admin/emails
// @access  Private/Admin
router.get('/emails', protect, admin, async (req, res) => {
  try {
    const { data: campaigns } = await supabase.from('email_campaigns').select('*').order('created_at', { ascending: false });
    const { data: templates } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
    
    res.json({ 
      success: true, 
      campaigns: campaigns || [], 
      templates: templates || [] 
    });
  } catch (error) {
    console.error('[Admin Emails Error]:', error);
    res.status(500).json({ message: 'Failed to fetch emails' });
  }
});

module.exports = router;
