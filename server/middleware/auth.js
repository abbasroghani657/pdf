const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];

    try {
      // ✅ Securely verify token with Supabase (makes a network call or uses Supabase client)
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authData.user) {
        return res.status(401).json({ message: 'Not authorized, invalid or expired token.' });
      }

      const userId = authData.user.id;

      // Attach basic user info
      req.user = {
        id: userId,
        email: authData.user.email,
      };

      // Fetch profile from DB (Mandatory for security & role checking)
      const { data: profile, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbErr) {
        console.error('[Auth] Database error while fetching profile:', dbErr.message);
        return res.status(500).json({ message: 'Internal server error verifying user profile.' });
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
