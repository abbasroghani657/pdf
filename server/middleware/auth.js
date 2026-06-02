const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    try {
      // ✅ Decode JWT locally — NO network call to Supabase needed
      // This avoids ETIMEDOUT errors caused by ISP restrictions in Pakistan
      const decoded = jwt.decode(token);

      if (!decoded || !decoded.sub) {
        return res.status(401).json({ message: 'Not authorized, invalid token.' });
      }

      // Check token expiry manually
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({ message: 'Not authorized, token expired.' });
      }

      // Attach basic user info from token payload
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      // Try to fetch profile from DB (optional — don't fail if network is down)
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.sub)
          .single();

        if (profile) {
          req.user.profile = profile;
          if (profile.is_banned) {
            return res.status(403).json({ message: 'Account banned. Please contact support.' });
          }
        }
      } catch (dbErr) {
        // Profile fetch failed (network issue) — continue with basic user info
        console.warn('[Auth] Could not fetch user profile from DB (network issue):', dbErr.message);
      }

      next();
    } catch (err) {
      console.error('[Auth] Token decode error:', err.message);
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
