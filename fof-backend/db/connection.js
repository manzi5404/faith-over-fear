const mysql = require('mysql2/promise');

// 1. Create the connection pool - uses environment variables for Railway/production
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'faith_over_fear',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Export the pool
module.exports = pool;