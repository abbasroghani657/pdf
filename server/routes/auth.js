const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: { message: 'Too many attempts. Please try again after 15 minutes.' }
});

// Dedicated admin-only supabase client that ALWAYS uses service_role key
// This ensures it never inherits a user session and bypasses RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// @desc    Register a new user via Supabase
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, country } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // 1. Create user in Supabase Auth using admin API (uses service_role, no session switch)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // set true to require email verification
      user_metadata: { name }
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    const user = authData.user;

    // 2. Insert profile into public.users using admin client (bypasses RLS)
    if (user) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name: name,
          country: country || 'Unknown',
          role: 'user',
          is_pro: false,
          plan: 'Free'
        }]);

      if (dbError) {
        console.error('Error creating user profile in DB:', dbError);
        // Clean up auth user if profile fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return res.status(500).json({ message: 'Registration failed: could not create user profile.' });
      }
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: authData.user,
      session: null // No auto-login after registration; user must log in
    });

  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});


// @desc    Login user via Supabase
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    // Fetch user profile from public.users to return custom fields (role, plan)
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.is_banned) {
      return res.status(403).json({ message: 'Account banned. Please contact support.' });
    }

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    res.json({
      user: data.user,
      profile: profile || {},
      session: data.session
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user profile (Using Token)
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    user: req.user,       // Attached by auth middleware
    profile: req.user.profile // Attached by auth middleware
  });
});

// @desc    Send password reset email via Supabase
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Always return success to prevent email enumeration attacks
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Initiate OAuth login (Google, GitHub)
// @route   POST /api/auth/oauth/:provider
// @access  Public
router.post('/oauth/:provider', authLimiter, async (req, res) => {
  try {
    const { provider } = req.params;
    const allowedProviders = ['google', 'github'];

    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({ message: 'Invalid OAuth provider.' });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ url: data.url });
  } catch (error) {
    console.error('[OAuth Error]:', error);
    res.status(500).json({ message: 'Server error initiating OAuth' });
  }
});

// @desc    Sync OAuth user to public.users table
// @route   POST /api/auth/oauth/sync
// @access  Private (Requires valid Supabase token)
router.post('/oauth/sync', protect, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user already exists in public.users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, country')
      .eq('id', user.id)
      .single();

    let isNewUser = false;

    if (!existingUser) {
      isNewUser = true;
      // Create user profile
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
          country: 'Unknown',
          role: 'user',
          is_pro: false,
          plan: 'Free'
        }]);

      if (dbError) {
        console.error('Error creating OAuth user profile:', dbError);
        return res.status(500).json({ message: 'Failed to sync user profile.' });
      }
    } else if (existingUser.country === 'Unknown') {
      isNewUser = true;
    }

    res.json({ success: true, isNewUser });
  } catch (error) {
    console.error('[OAuth Sync Error]:', error);
    res.status(500).json({ message: 'Server error during OAuth sync' });
  }
});

// @desc    Update user profile (name, country)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, country } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .update({ name, country })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ profile: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user-specific usage stats (files processed, storage saved)
// @route   GET /api/auth/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Count total tool usage jobs for this user
    const { count: filesProcessed } = await supabase
      .from('tool_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Sum bytes_saved (compression savings) for this user
    const { data: savingsData } = await supabase
      .from('tool_usage')
      .select('bytes_saved')
      .eq('user_id', userId)
      .not('bytes_saved', 'is', null);

    const totalBytesSaved = savingsData
      ? savingsData.reduce((acc, row) => acc + (Number(row.bytes_saved) || 0), 0)
      : 0;

    // Format bytes saved into human-readable string
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Fetch last 15 tool usages to find the latest 3 unique tools
    const { data: recentActivity } = await supabase
      .from('tool_usage')
      .select('tool_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    const recentToolsMap = new Map();
    if (recentActivity) {
      for (const row of recentActivity) {
        if (!recentToolsMap.has(row.tool_name)) {
          recentToolsMap.set(row.tool_name, row.created_at);
        }
        if (recentToolsMap.size >= 3) break;
      }
    }
    const recentTools = Array.from(recentToolsMap.entries()).map(([name, time]) => ({ name, time }));

    res.json({
      success: true,
      filesProcessed: filesProcessed || 0,
      storageSaved: formatBytes(totalBytesSaved),
      recentTools
    });
  } catch (error) {
    console.error('[User Stats Error]:', error);
    res.status(500).json({ message: 'Failed to fetch user stats.' });
  }
});

// @desc    Reset password using Supabase recovery token from email link
// @route   POST /api/auth/reset-password
// @access  Public (token from email hash)
router.post('/reset-password', async (req, res) => {
  try {
    const { accessToken, password } = req.body;

    if (!accessToken || !password) {
      return res.status(400).json({ message: 'Access token and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Verify the access token directly and get the user ID
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userData?.user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    const userId = userData.user.id;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (updateError) {
      return res.status(400).json({ message: updateError.message || 'Failed to update password.' });
    }

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Reset Password Error]:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
