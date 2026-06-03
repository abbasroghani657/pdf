const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const { protect } = require('../middleware/auth');

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
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
router.post('/forgot-password', async (req, res) => {
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

module.exports = router;
