const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Not authorized, token failed or expired.' });
    }

    // Attach user to req
    req.user = user;

    // Fetch custom user profile (isBanned, role, etc.) from public.users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      req.user.profile = profile;
      if (profile.is_banned) {
        return res.status(403).json({ message: 'Account banned. Please contact support.' });
      }
    }

    next();
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
