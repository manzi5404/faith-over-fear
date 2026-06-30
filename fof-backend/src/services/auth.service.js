const { supabase } = require('../config/supabase');
const userRepo = require('../repositories/user.repository');
const { AuthError, ValidationError, ConflictError } = require('../utils/errors');
const { isAdminEmail } = require('../utils/env');

function resolveRole(email) {
  return isAdminEmail(email) ? 'admin' : 'customer';
}

async function register(email, password, name) {
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (authError) {
    throw new AuthError(authError.message || 'Registration failed');
  }

  if (!authData.user) {
    throw new AuthError('Registration failed: no user returned');
  }

  if (!authData.user.id) {
    throw new AuthError('Registration failed: no user ID returned from auth provider');
  }

  let user;
    try {
      user = await userRepo.create(authData.user.id, {
        name: name || null,
        email,
        role: resolveRole(email),
      });
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError('Email already registered');
    }
    throw err;
  }

  const { events } = require('../events');
  events.emit(events.USER_REGISTERED, { user });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function login(email, password) {
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session) {
    throw new AuthError('Invalid email or password');
  }

  if (!data.session.access_token) {
    throw new AuthError('Missing access token');
  }

  if (!data.session.refresh_token) {
    throw new AuthError('Missing refresh token');
  }

  const authUser = data.user ?? data.session?.user;
  if (!authUser?.id) {
    throw new AuthError('Authentication returned no user ID');
  }

  let user = await userRepo.findById(authUser.id);
  if (!user) {
    user = await userRepo.create(authUser.id, {
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
      role: resolveRole(authUser.email),
    });
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

async function googleOAuth(idToken) {
  if (!idToken) {
    throw new ValidationError('ID token is required');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error || !data?.user) {
    throw new AuthError('Google authentication failed');
  }

  if (!data.user.id) {
    throw new AuthError('Google authentication returned no user ID');
  }

  const googleId = data.user.id;
  const email = data.user.email;
  const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || null;

  let existingUser = await userRepo.findByEmail(email);

  if (existingUser) {
    if (!existingUser.google_id) {
      await userRepo.updateRole(existingUser.id, existingUser.role);
    }
  } else {
    existingUser = await userRepo.create(data.user.id, {
      name,
      email,
      role: resolveRole(email),
      googleId,
    });
  }

  return {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    role: existingUser.role,
  };
}

async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new AuthError('User not found');
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

module.exports = {
  register,
  login,
  googleOAuth,
  getProfile,
};
