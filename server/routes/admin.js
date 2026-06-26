const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, admin, superadmin } = require('../middleware/auth');
const { Resend } = require('resend');

// ─── Shared mail transporter ───────────────────────────────────────────────────
function getTransporter() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendRoleInvitationEmail({ toEmail, toName, newRole, assignedByName, siteUrl }) {
  const roleLabel = newRole === 'superadmin' ? 'Super Admin' : 'Admin';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f3f4f6; margin:0; padding:0; }
    .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header { background:linear-gradient(135deg,#378ADD,#8b5cf6); padding:36px 32px; text-align:center; }
    .header img { width:44px; height:44px; border-radius:10px; }
    .header h1 { color:#fff; font-size:22px; margin:12px 0 0; }
    .body { padding:32px; }
    .badge { display:inline-block; background:${newRole === 'superadmin' ? '#7c3aed' : '#1e40af'}; color:#fff; padding:4px 14px; border-radius:999px; font-size:13px; font-weight:600; margin-bottom:20px; }
    .body h2 { color:#111827; font-size:20px; margin:0 0 12px; }
    .body p  { color:#4b5563; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .cta { text-align:center; margin:28px 0; }
    .btn { background:linear-gradient(135deg,#378ADD,#8b5cf6); color:#fff!important; text-decoration:none; padding:14px 36px; border-radius:10px; font-size:15px; font-weight:700; display:inline-block; }
    .info-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:16px 20px; margin:20px 0; }
    .info-box p { color:#0c4a6e; margin:0; font-size:14px; }
    .footer { text-align:center; padding:20px 32px; border-top:1px solid #f3f4f6; color:#9ca3af; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>TheyLovePDF Admin Panel</h1>
    </div>
    <div class="body">
      <span class="badge">${roleLabel} Invitation</span>
      <h2>You've been granted ${roleLabel} access!</h2>
      <p>Hi${toName ? ` <strong>${toName}</strong>` : ''},</p>
      <p><strong>${assignedByName}</strong> has assigned you the <strong>${roleLabel}</strong> role on TheyLovePDF. You can now access the Admin Panel to manage users, tools, and platform operations.</p>
      <div class="info-box">
        <p><strong>Your new role:</strong> ${roleLabel}</p>
        <p style="margin-top:8px"><strong>Assigned by:</strong> ${assignedByName}</p>
      </div>
      <div class="cta">
        <a href="${siteUrl}/admin" class="btn">Open Admin Panel →</a>
      </div>
      <p style="font-size:13px;color:#6b7280">If you did not expect this invitation, please contact support immediately at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} TheyLovePDF. All rights reserved.</div>
  </div>
</body>
</html>`;

  const resend = getTransporter();
  await resend.emails.send({
    from: `"TheyLovePDF Admin" <noreply@theylovepdf.com>`,
    to: [toEmail],
    subject: `🎉 You've been made a ${roleLabel} on TheyLovePDF`,
    html,
  });
}

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
    const { data: usageData } = await supabase.from('tool_usage').select('tool_name');
    const toolMap = {};
    if (usageData) {
      usageData.forEach(u => {
        // Humanize the slug e.g. "merge-pdf" -> "Merge PDF"
        const toolName = (u.tool_name || 'unknown').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

// @desc    Send Admin Invitation (does NOT change role immediately)
// @route   POST /api/admin/invitations
// @access  Private/SuperAdmin
router.post('/invitations', protect, superadmin, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Valid email and role (admin/superadmin) are required.' });
    }

    // Find user by email
    const { data: targetUser, error: userErr } = await supabase
      .from('users').select('id, email, name, role').eq('email', email.toLowerCase().trim()).single();

    if (userErr || !targetUser) {
      return res.status(404).json({ message: 'No account found with that email. The user must sign up first.' });
    }

    if (targetUser.role === role) {
      return res.status(400).json({ message: `This user is already a ${role}.` });
    }

    // Expire any existing pending invitations for this user
    await supabase.from('admin_invitations')
      .update({ status: 'expired' })
      .eq('invited_email', email.toLowerCase().trim())
      .eq('status', 'pending');

    // Create invitation token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const assignerName = req.user?.profile?.name || req.user?.email || 'Super Admin';
    const siteUrl = process.env.APP_URL || 'http://localhost:3000';

    const { error: insertErr } = await supabase.from('admin_invitations').insert({
      token,
      invited_email: email.toLowerCase().trim(),
      invited_user_id: targetUser.id,
      role,
      invited_by_id: req.user.id,
      invited_by_name: assignerName,
      site_url: siteUrl,
      status: 'pending',
      expires_at: expiresAt,
    });

    if (insertErr) throw insertErr;

    // Send beautiful invitation email
    const roleLabel = role === 'superadmin' ? 'Super Admin' : 'Admin';
    const acceptUrl = `${siteUrl}/accept-invite/${token}`;
    const declineUrl = `${siteUrl}/accept-invite/${token}?action=decline`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Invitation</title>
</head>
<body style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    
    <!-- HEADER -->
    <tr>
      <td style="background: #0f172a; padding: 48px 32px; text-align: center;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #378ADD, #8b5cf6); background-color: #378ADD; border-radius: 14px; text-align: center; line-height: 56px; margin: 0 auto 20px;">
                <span style="color: #ffffff; font-size: 28px; font-weight: 800; font-family: Arial, sans-serif;">P</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0;">TheyLovePDF Admin Panel</h1>
              <p style="color: #94a3b8; font-size: 15px; margin: 8px 0 0;">You have a new admin role invitation</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding: 40px 32px;">
        <div style="text-align: left;">
          <span style="display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 24px; ${role === 'superadmin' ? 'background-color: #f3e8ff; color: #7c3aed;' : 'background-color: #dbeafe; color: #1d4ed8;'}">
            ${role === 'superadmin' ? '👑' : '🛡️'} &nbsp;${roleLabel} Invitation
          </span>
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px;">You're invited to join the team!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi <strong>${targetUser.name || targetUser.email}</strong>,</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;"><strong>${assignerName}</strong> would like to grant you <strong>${roleLabel}</strong> access on the TheyLovePDF platform. Please review the details below and accept or decline this invitation.</p>
        </div>

        <!-- INFO CARD -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 0 32px;">
          <tr>
            <td style="padding: 20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Invited By</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">${assignerName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Your New Role</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">${roleLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; font-weight: 600;">Your Account</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #378ADD; font-size: 15px; font-weight: 700; text-align: right;">${targetUser.email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #64748b; font-size: 14px; font-weight: 600;">Invitation Expires</td>
                  <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right;">48 hours from now</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA AREA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
          <tr>
            <td align="center">
              <a href="${acceptUrl}" style="display: inline-block; background-color: #378ADD; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 15px rgba(55,138,221,0.35);">
                ✅ Accept Invitation
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 16px;">
              <a href="${declineUrl}" style="color: #94a3b8; text-decoration: none; font-size: 14px;">No thanks, decline this invitation</a>
            </td>
          </tr>
        </table>

        <!-- WARNING BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;">
          <tr>
            <td style="padding: 16px 20px; color: #9a3412; font-size: 13px; line-height: 1.6;">
              ⚠️ <strong>Security Notice:</strong> If you did not expect this invitation or don't recognize the sender, please ignore this email and contact <a href="mailto:${process.env.EMAIL_USER}" style="color: #c2410c; text-decoration: underline;">${process.env.EMAIL_USER}</a> immediately. Your account role will NOT change unless you click Accept.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">© ${new Date().getFullYear()} TheyLovePDF · This link expires in 48 hours · Do not share this email</p>
      </td>
    </tr>

  </table>
</body>
</html>`;

    try {
      const resend = getTransporter();
      await resend.emails.send({
        from: `"TheyLovePDF Admin" <noreply@theylovepdf.com>`,
        to: [targetUser.email],
        subject: `🛡️ Admin Invitation: ${assignerName} wants to make you a ${roleLabel} on TheyLovePDF`,
        html,
      });
    } catch (mailErr) {
      console.warn('[Invitation Email] Failed:', mailErr.message);
      // Still return success — invitation is in DB, user can check later
    }

    res.json({ success: true, message: `Invitation sent to ${targetUser.email}. They must accept it within 48 hours.` });
  } catch (error) {
    console.error('[Admin Invitation Error]:', error);
    res.status(500).json({ message: 'Failed to send invitation.' });
  }
});


// @desc    Accept or Decline Admin Invitation (public — no auth needed)
// @route   GET /api/admin/invitations/:token/accept
// @access  Public (via email link)
router.get('/invitations/:token/:action', async (req, res) => {
  const { token, action } = req.params;
  const isDecline = action === 'decline';

  try {
    const { data: invite, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invite) {
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/invite-response?status=invalid`);
    }

    if (invite.status !== 'pending') {
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/invite-response?status=${invite.status}`);
    }

    if (new Date(invite.expires_at) < new Date()) {
      await supabase.from('admin_invitations').update({ status: 'expired' }).eq('token', token);
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/invite-response?status=expired`);
    }

    if (isDecline) {
      await supabase.from('admin_invitations').update({ status: 'expired' }).eq('token', token);
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/invite-response?status=declined`);
    }

    // Accept: Update user role + mark invitation accepted
    await supabase.from('users').update({ role: invite.role }).eq('id', invite.invited_user_id);
    await supabase.from('admin_invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('token', token);

    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/invite-response?status=accepted&role=${invite.role}`);
  } catch (err) {
    console.error('[Invitation Accept Error]:', err);
    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/invite-response?status=error`);
  }
});


// @desc    Update user role directly (kept for inline role edit from admin list)
// @route   PUT /api/admin/users/:id/role
// @access  Private/SuperAdmin
router.put('/users/:id/role', protect, superadmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (req.user.id === req.params.id && role !== 'superadmin') {
      return res.status(400).json({ message: 'You cannot demote your own superadmin account.' });
    }
    const { data, error } = await supabase
      .from('users').update({ role }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    console.error('[Admin Update Role Error]:', error);
    res.status(500).json({ message: 'Failed to update role' });
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
// @access  Private/SuperAdmin
router.put('/settings', protect, superadmin, async (req, res) => {
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
      visitors: usersCount || 0,
      sessions: toolsCount || 0,
      pageViews: toolsCount || 0,
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
    // Note: Tables 'email_campaigns' and 'email_templates' do not exist in the setup script.
    // Returning mock data to keep the UI functional until the DB tables are created.
    
    const mockCampaigns = [];
    const mockTemplates = [];

    res.json({ 
      success: true, 
      campaigns: mockCampaigns, 
      templates: mockTemplates 
    });
  } catch (error) {
    console.error('[Admin Emails Error]:', error);
    res.status(500).json({ message: 'Failed to fetch emails' });
  }
});

// @desc    Health check for services
// @route   GET /api/admin/health
// @access  Private/Admin
router.get('/health', protect, admin, async (req, res) => {
  const axios = require('axios');
  const checkService = async (url) => {
    try {
      const response = await axios.get(url, { timeout: 3000 });
      return response.status === 200;
    } catch {
      return false;
    }
  };

  const [pythonOk, gotenbergOk] = await Promise.all([
    checkService((process.env.CONVERTER_URL || 'http://localhost:3006') + '/health'),
    checkService((process.env.GOTENBERG_URL || 'http://localhost:3001') + '/health')
  ]);

  // Check DB
  let dbOk = false;
  try {
    const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' });
    dbOk = !error;
  } catch { dbOk = false; }

  res.json({ success: true, python: pythonOk, gotenberg: gotenbergOk, database: dbOk });
});

// @desc    Get real-time notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
router.get('/notifications', protect, admin, async (req, res) => {
  try {
    const notifications = [];

    // 1. Recent Payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id, user_email, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (payments) {
      payments.forEach(p => {
        notifications.push({
          id: `pay_${p.id}`,
          title: 'New Payment',
          message: `${p.user_email} paid $${p.amount}`,
          type: 'success',
          time: p.created_at
        });
      });
    }

    // 2. Recent Errors
    const { data: errors } = await supabase
      .from('tool_usage')
      .select('id, tool_name, created_at')
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(3);

    if (errors) {
      errors.forEach(e => {
        notifications.push({
          id: `err_${e.id}`,
          title: 'Tool Error',
          message: `${e.tool_name} failed during processing`,
          type: 'error',
          time: e.created_at
        });
      });
    }

    // 3. New Users
    const { data: users } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (users) {
      users.forEach(u => {
        notifications.push({
          id: `usr_${u.id}`,
          title: 'New User Registration',
          message: `${u.email} joined the platform`,
          type: 'info',
          time: u.created_at
        });
      });
    }

    // Sort by time descending and take top 5
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    const topNotifications = notifications.slice(0, 5);

    res.json({ success: true, notifications: topNotifications });
  } catch (error) {
    console.error('[Admin Notifications Error]:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

module.exports = router;
