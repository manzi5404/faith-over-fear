const mysql = require('mysql2/promise');
require('dotenv').config();
console.log('🚀 db/connection.js loaded');

const envPresence = {
  MYSQLHOST: !!process.env.MYSQLHOST,
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
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
};

const missing = [];
if (!dbConfig.host) missing.push('MYSQLHOST');
if (!dbConfig.user) missing.push('MYSQLUSER');
if (dbConfig.password === undefined || dbConfig.password === null) missing.push('MYSQLPASSWORD');
if (!dbConfig.database) missing.push('MYSQLDATABASE');
if (!dbConfig.port) missing.push('MYSQLPORT');

if (missing.length > 0) {
  const message = `Missing required DB env vars: ${missing.join(', ')}`;
  console.error('❌ DB connection validation failed:', message);
  throw new Error(message);
}

const normalizedPort = parseInt(dbConfig.port, 10);
if (Number.isNaN(normalizedPort) || normalizedPort <= 0) {
  const message = `Invalid DB port value: ${dbConfig.port}`;
  console.error('❌ DB connection validation failed:', message);
  throw new Error(message);
}

const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: normalizedPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ DB config validated');

module.exports = pool;