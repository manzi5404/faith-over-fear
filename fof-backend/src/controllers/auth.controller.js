const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const authService = require('../services/auth.service');
const { events } = require('../events');

const registerSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.email || !body.password) {
      throw new Error('email and password are required');
    }
    if (body.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    return body;
  },
};

const loginSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.email || !body.password) {
      throw new Error('email and password are required');
    }
    return body;
  },
};

const googleSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.id_token) {
      throw new Error('id_token is required');
    }
    return body;
  },
};

function handleServiceError(res, err) {
  const statusCode = err.statusCode || 500;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
    return res.status(statusCode).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: 'Internal Server Error' });
}

function sendAuthResponse(res, tokenData) {
  return res.status(200).json({
    success: true,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    user: tokenData.user,
  });
}

async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    const user = await authService.register(email, password, name);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const tokenData = await authService.login(email, password);
    return sendAuthResponse(res, tokenData);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function googleAuth(req, res) {
  try {
    const { id_token } = req.body;
    const tokenData = await authService.googleOAuth(id_token);
    return sendAuthResponse(res, tokenData);
  } catch (err) {
    return handleServiceError(res, err);
  }
}

async function me(req, res) {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return handleServiceError(res, err);
  }
}

module.exports = {
  register,
  login,
  googleAuth,
  me,
};
