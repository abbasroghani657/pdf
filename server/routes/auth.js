const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const { protect, protectAuthOnly } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min — safe for OAuth + blocks brute force
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});
 
// Dedicated admin-only supabase client that ALWAYS uses service_role key
// This ensures it never inherits a user session and bypasses RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
 
// @desc    Check if email exists for smart auth flow
// @route   POST /api/auth/check-email
// @access  Public
router.post('/check-email', authLimiter, async (req, res) => {
  const startTime = Date.now();
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
 
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, auth_provider')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
 
    const exists = !!data;
 
    // Timing attack prevention: enforce a consistent response time (approx 300ms)
    // whether the email exists in the database or not.
    const elapsedTime = Date.now() - startTime;
    const targetTime = 300;
    if (elapsedTime < targetTime) {
      await new Promise(resolve => setTimeout(resolve, targetTime - elapsedTime));
    }
 
    res.json({ 
      exists, 
      name: data?.name,
      provider: data?.auth_provider || 'email'  // 'email' | 'google'
    });
  } catch (error) {
    console.error('[Check Email Error]:', error);
    res.status(500).json({ message: 'Server error checking email' });
  }
});
 
// @desc    Register a new user via Supabase
// @route   POST /api/auth/register
// @access  Public
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, country } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
 
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
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
        .upsert([{
          id: user.id,
          email: user.email,
          name: name,
          country: country || 'Unknown',
          role: 'user',
          is_pro: false,
          plan: 'Free',
          auth_provider: 'email'
        }], { onConflict: 'id' });
 
      if (dbError) {
        console.error('Error creating user profile in DB:', dbError);
        // Clean up auth user if profile fails
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return res.status(500).json({ message: 'Registration failed: could not create user profile.' });
      }
    }
 
    res.status(201).json({
      message: 'Account created successfully! You can now log in.',
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
      // Check if this is a Google OAuth account trying to use password login
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('auth_provider')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (profile?.auth_provider === 'google') {
        return res.status(401).json({ 
          message: 'This account uses Google sign-in. Please click "Continue with Google" instead.',
          provider: 'google'
        });
      }
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
 
// @desc    Exchange PKCE code for session
// @route   POST /api/auth/oauth/exchange
// @access  Public
router.post('/oauth/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required.' });
 
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      return res.status(400).json({ message: error.message });
    }
 
    res.json({
      access_token: data.session.access_token,
      user: data.user
    });
  } catch (error) {
    console.error('[OAuth Exchange Error]:', error);
    res.status(500).json({ message: 'Server error during token exchange' });
  }
});
 
// @desc    Sync OAuth user to public.users table
// @route   POST /api/auth/oauth/sync
// @access  Private (Requires valid Supabase token)
router.post('/oauth/sync', protectAuthOnly, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user already exists in public.users by ID
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, country')
      .eq('id', user.id)
      .maybeSingle();
 
    let isNewUser = false;
 
    if (!existingUser) {
      // Check if email already exists to prevent unique constraint violation
      const { data: emailUser } = await supabaseAdmin
        .from('users')
        .select('id, auth_provider')
        .eq('email', user.email)
        .maybeSingle();

      if (emailUser) {
        // Email exists but ID is different!
        return res.status(400).json({ 
          message: `This email is already registered using ${emailUser.auth_provider}. Please log in using your original method.` 
        });
      }

      isNewUser = true;
      // Create user profile
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .upsert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
          country: 'Unknown',
          role: 'user',
          is_pro: false,
          plan: 'Free',
          auth_provider: 'google'
        }], { onConflict: 'id', ignoreDuplicates: false });
 
      if (dbError) {
        console.error('Error creating OAuth user profile:', dbError);
        return res.status(500).json({ message: 'Failed to sync user profile. Database error: ' + dbError.message });
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
 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const avatarsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// @desc    Upload user avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
router.post('/upload-avatar', protect, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('[Multer Error]:', err);
      fs.writeFileSync(path.join(__dirname, '../error_log.txt'), '[Multer Error] ' + err.toString());
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    // For local dev proxy or direct URL
    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const avatarUrl = `${APP_URL}/api/avatars/${req.file.filename}`;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { avatar_url: avatarUrl }
    });

    if (error) {
      console.error('[Supabase Auth Update Error]:', error);
      fs.writeFileSync(path.join(__dirname, '../error_log.txt'), '[Supabase Auth Error] ' + JSON.stringify(error));
      return res.status(400).json({ message: error.message });
    }

    res.json({ avatar_url: avatarUrl });
  } catch (error) {
    console.error('[Upload Avatar Catch Error]:', error);
    fs.writeFileSync(path.join(__dirname, '../error_log.txt'), '[Catch Error] ' + error.toString());
    res.status(500).json({ message: error.message || 'Server error uploading avatar' });
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
router.post('/reset-password', authLimiter, async (req, res) => {
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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    // Supabase requires logging in to verify the current password
    // First fetch the user's email since we need it for sign in
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('email, auth_provider')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (userProfile.auth_provider !== 'email') {
      return res.status(400).json({ message: `Cannot change password. Account uses ${userProfile.auth_provider} sign-in.` });
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userProfile.email,
      password: currentPassword,
    });

    if (signInError) {
      console.error('[Change Password] signInError:', signInError);
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Now update the password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });

    if (updateError) {
      console.error('[Change Password] updateError:', updateError);
      return res.status(400).json({ message: updateError.message || 'Failed to update password.' });
    }

    // Log the user out of all sessions for security (optional, but good practice)
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[Change Password Error]:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    // Delete user from auth.users (cascade deletes public.users profile usually if configured)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('[Delete Account Auth Error]:', error);
      return res.status(400).json({ message: 'Failed to delete account. Please contact support.' });
    }
    
    // Fallback: manually delete from public.users if cascade isn't setup
    await supabaseAdmin.from('users').delete().eq('id', userId);

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('[Delete Account Error]:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
