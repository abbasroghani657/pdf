const supabase = require('../config/supabase');

// Wrap a promise with a timeout — prevents socket hang up when Supabase is slow
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT:${label}`)), ms)
    ),
  ]);

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    try {
      // ✅ Securely verify token with Supabase — with a 4-second timeout
      // to prevent "socket hang up" errors caused by slow ISP connections
      let authData;
      try {
        const result = await withTimeout(
          supabase.auth.getUser(token),
          4000,
          'auth.getUser'
        );
        authData = result.data;
        if (result.error || !authData?.user) {
          return res.status(401).json({ message: 'Not authorized, invalid or expired token.' });
        }
      } catch (authErr) {
        if (authErr.message?.startsWith('TIMEOUT')) {
          console.warn('[Auth] supabase.auth.getUser timed out — returning 503');
          return res.status(503).json({ message: 'Authentication service is temporarily unavailable. Please try again.' });
        }
        return res.status(401).json({ message: 'Not authorized, token failed.' });
      }

      const userId = authData.user.id;
      req.user = { id: userId, email: authData.user.email };

      // Fetch profile from DB — also with timeout (mandatory for role & ban checks)
      let profile;
      try {
        const { data, error: dbErr } = await withTimeout(
          supabase.from('users').select('*').eq('id', userId).single(),
          5000,
          'db.profile'
        );
        if (dbErr) {
          console.error('[Auth] Database error fetching profile:', dbErr.message);
          return res.status(500).json({ message: 'Internal server error verifying user profile.' });
        }
        profile = data;
      } catch (dbTimeout) {
        console.warn('[Auth] DB profile fetch timed out:', dbTimeout.message);
        return res.status(503).json({ message: 'Database is temporarily unavailable. Please try again.' });
      }

      if (!profile) {
        return res.status(401).json({ message: 'User profile not found.' });
      }
      if (profile.is_banned) {
        return res.status(403).json({ message: 'Account banned. Please contact support.' });
      }

      req.user.profile = profile;
      next();
    } catch (err) {
      console.error('[Auth] Token verification error:', err.message);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.profile && (req.user.profile.role === 'admin' || req.user.profile.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const superadmin = (req, res, next) => {
  if (req.user && req.user.profile && req.user.profile.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as superadmin' });
  }
};

module.exports = { protect, admin, superadmin };

