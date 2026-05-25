const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

// @desc    Register a new user via Supabase
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, country } = req.body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // 2. Insert into custom public.users table for profile data
    const user = authData.user;
    if (user) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          { 
            id: user.id, 
            email: user.email, 
            name: name,
            country: country || 'Unknown',
            role: 'user',
            is_pro: false,
            plan: 'Free'
          }
        ]);
        
      if (dbError) {
        console.error('Error creating user profile in DB:', dbError);
        // Best effort error handling
      }
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account (if enabled in Supabase).',
      user: authData.user,
      session: authData.session
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;
