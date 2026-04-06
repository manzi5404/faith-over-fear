const mysql = require('mysql2/promise');
require('dotenv').config();

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