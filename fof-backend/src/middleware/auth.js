const { supabase } = require('../config/supabase');
const { AuthError } = require('../utils/errors');

const extractBearerToken = (headerValue) => {
  if (!headerValue) return null;
  const parts = String(headerValue).trim().split(' ');
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) return parts[1];
  return null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AuthError('Missing Bearer token');
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw new AuthError('Invalid or expired token');
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('id, email, role, name')
      .eq('id', data.user.id)
      .maybeSingle();

    if (userError || !userRow) {
      throw new AuthError('User profile not found');
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      name: userRow.name,
    };

    return next();
  } catch (err) {
    const statusCode = err.statusCode || 401;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Unauthorized',
    });
  }
};

module.exports = { requireAuth };
