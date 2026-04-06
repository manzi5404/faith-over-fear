const mysql = require('mysql2/promise');
require('dotenv').config();

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
  throw new Error(`Missing required DB env vars: ${missing.join(', ')}`);
}

const normalizedPort = parseInt(dbConfig.port, 10);
if (Number.isNaN(normalizedPort) || normalizedPort <= 0) {
  throw new Error(`Invalid DB port value: ${dbConfig.port}`);
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

console.log('DB config loaded:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: normalizedPort
});

module.exports = pool;