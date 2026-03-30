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

// 2. Test the connection and initialize required tables.
// This runs immediately when the module is loaded to verify connectivity.
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected successfully to database: faith_over_fear');

        await connection.query(
            `CREATE TABLE IF NOT EXISTS contact_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(100),
                message TEXT NOT NULL,
                status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        );

        await connection.query(
            `CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('reservation', 'message', 'payment') NOT NULL,
                reference_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                is_seen BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        );

        console.log('✅ Database tables are present or were created successfully.');
        connection.release(); // Always release the connection back to the pool
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        // Optional: process.exit(1); // Exit if DB is critical
    }
})();

// 3. Export the pool
module.exports = pool;