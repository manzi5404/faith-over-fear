const mysql = require('mysql2/promise');

// 1. Create the connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Empty password as requested
    database: 'faith_over_fear',
    waitForConnections: true,
    connectionLimit: 10, // Adjust based on your needs
    queueLimit: 0
});

// 2. Test the connection (Error Handling)
// This runs immediately when the module is loaded to verify connectivity.
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected successfully to database: faith_over_fear');
        connection.release(); // Always release the connection back to the pool
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        // Optional: process.exit(1); // Exit if DB is critical
    }
})();

// 3. Export the pool
module.exports = pool;