const { supabase } = require('../config/supabase');
const { AuthError } = require('../utils/errors');

const extractBearerToken = (headerValue) => {
  if (!headerValue) return null;
  const parts = String(headerValue).trim().split(' ');
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) return parts[1];
  return null;
};

const requireAuth = async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Missing Bearer token',
    });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, email, role, name')
    .eq('id', data.user.id)
    .maybeSingle();

  if (userError) {
    console.error('[AUTH] Database error fetching user profile:', userError);
    return res.status(500).json({
      success: false,
      error: 'Failed to load user profile',
    });
  }

  if (!userRow) {
    return res.status(401).json({
      success: false,
      error: 'User profile not found',
    });
  }

  req.user = {
    id: userRow.id,
    email: userRow.email,
    role: userRow.role,
    name: userRow.name,
  };

  return next();
};

module.exports = { requireAuth };
