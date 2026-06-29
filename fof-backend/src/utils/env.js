const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'RESEND_API_KEY',
  'FROM_EMAIL',
];

function validateEnv() {
  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nPlease set these variables in your .env file or deployment environment.');
    process.exit(1);
  }

  if (!process.env.PORT) {
    console.warn('⚠️  PORT not set, defaulting to 3000');
  }

  if (!process.env.NODE_ENV) {
    console.warn('⚠️  NODE_ENV not set, defaulting to development');
  }

  console.log('✅ Environment validation passed');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT || 3000}`);
}

function getEnv() {
  return {
    required: requiredEnvVars,
    optional: optionalEnvVars,
    values: {
      SUPABASE_URL: process.env.SUPABASE_URL ? '***' : 'MISSING',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '***' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***' : 'MISSING',
      PORT: process.env.PORT || '3000 (default)',
      NODE_ENV: process.env.NODE_ENV || 'development (default)',
    },
  };
}

module.exports = { validateEnv, getEnv };
