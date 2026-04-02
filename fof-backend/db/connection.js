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

        await connection.query(
            `CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                product_id INT NOT NULL,
                drop_id INT DEFAULT NULL,
                product_name VARCHAR(255) DEFAULT NULL,
                size VARCHAR(20) DEFAULT NULL,
                color VARCHAR(50) DEFAULT NULL,
                quantity INT NOT NULL DEFAULT 1,
                total_price DECIMAL(15, 2) NOT NULL,
                status ENUM('pending', 'contacted', 'delivered', 'cancelled') DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'reservation',
                customer_name VARCHAR(255) DEFAULT NULL,
                customer_email VARCHAR(255) DEFAULT NULL,
                customer_phone VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
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