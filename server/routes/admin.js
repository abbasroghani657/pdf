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

    // 5. Total Revenue (Mocked for now since payment is mock)
    // Assuming $4.99 per Pro user
    const totalRevenue = (proUsers * 4.99).toFixed(2);

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        proUsers: proUsers || 0,
        newToday: newToday || 0,
        totalRevenue: `$${totalRevenue}`,
      },
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

// @desc    Get Revenue Data
// @route   GET /api/admin/revenue
// @access  Private/Admin
router.get('/revenue', protect, admin, async (req, res) => {
  try {
    const { data: proUsers, error } = await supabase
      .from('users')
      .select('email, created_at, plan')
      .eq('is_pro', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalProUsers = proUsers.length;
    const totalRevenue = totalProUsers * 4.99;

    // We can simulate transactions using the proUsers list
    const transactions = proUsers.map(user => ({
      time: user.created_at,
      user: user.email,
      plan: 'Pro Monthly',
      amount: '$4.99',
      status: 'Paid',
      statusCls: 'text-emerald-600 bg-emerald-50'
    }));

    res.json({
      success: true,
      stats: {
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
        proUsersCount: totalProUsers
      },
      transactions: transactions
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
    res.json({ success: true, logs: logs || [] });
  } catch (error) {
    console.error('[Admin Security Error]:', error);
    res.status(500).json({ message: 'Failed to fetch logs' });
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

module.exports = router;
