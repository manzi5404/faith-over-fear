const { ForbiddenError } = require('../utils/errors');

const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Admin role required');
    }

    return next();
  } catch (err) {
    const statusCode = err.statusCode || 403;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Forbidden',
    });
  }
};

module.exports = { requireAdmin };
