const mysql = require('mysql2/promise');
require('dotenv').config();
const timestamp = () => new Date().toISOString();
const log = (...args) => console.log(`[${timestamp()}]`, ...args);
const logError = (...args) => console.error(`[${timestamp()}]`, ...args);
log('🚀 db/connection.js loaded');

const envPresence = {
  MYSQLHOST: !!process.env.MYSQLHOST ,
  MYSQLUSER: !!process.env.MYSQLUSER,
  MYSQLPASSWORD: process.env.MYSQLPASSWORD !== undefined && process.env.MYSQLPASSWORD !== null,
  MYSQLDATABASE: !!process.env.MYSQLDATABASE,
  MYSQLPORT: !!process.env.MYSQLPORT,
  DB_HOST: !!process.env.DB_HOST,
  DB_USER: !!process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null,
  DB_NAME: !!process.env.DB_NAME,
  DB_PORT: !!process.env.DB_PORT
};
console.log('⚙️ DB env presence:', envPresence);
console.log('⚙️ Validating DB environment variables');

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT
};

const missing = [];
if (!dbConfig.host) missing.push('MYSQLHOST/DB_HOST');
if (!dbConfig.user) missing.push('MYSQLUSER/DB_USER');
if (dbConfig.password === undefined || dbConfig.password === null) missing.push('MYSQLPASSWORD/DB_PASSWORD');
if (!dbConfig.database) missing.push('MYSQLDATABASE/DB_NAME');
if (!dbConfig.port) missing.push('MYSQLPORT/DB_PORT');

const normalizedPort = parseInt(dbConfig.port, 10);
const invalidPort = Number.isNaN(normalizedPort) || normalizedPort <= 0;

if (missing.length > 0) {
  logError('❌ DB env validation warning: missing variables:', missing.join(', '));
}
if (!dbConfig.port) {
  logError('❌ DB env validation warning: port variable missing');
}
if (invalidPort && dbConfig.port) {
  logError('❌ DB env validation warning: invalid port value:', dbConfig.port);
}

const createUnavailablePool = (reason) => {
  const error = new Error(`DB pool unavailable: ${reason}`);
  return {
    query: async () => { throw error; },
    execute: async () => { throw error; },
    getConnection: async () => { throw error; }
  };
};

let pool;
if (missing.length > 0 || invalidPort) {
  const reason = missing.length > 0 ? `Missing env vars: ${missing.join(', ')}` : `Invalid port: ${dbConfig.port}`;
  logError('❌ DB pool not created due to invalid configuration:', reason);
  pool = createUnavailablePool(reason);
} else {
  try {
    pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: normalizedPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    log('✅ DB pool created successfully');
  } catch (err) {
    logError('❌ Failed to create DB pool:', err);
    pool = createUnavailablePool(err.message || 'createPool failure');
  }
}

module.exports = pool;