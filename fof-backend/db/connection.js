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

        // 1. Store Config Table (Universal mode)
        await connection.query(
            `CREATE TABLE IF NOT EXISTS store_config (
                id INT PRIMARY KEY DEFAULT 1,
                store_mode ENUM('upcoming', 'reservation', 'live') DEFAULT 'upcoming',
                announcement TEXT
            )`
        );

        // Ensure default config exists
        const [configRows] = await connection.query('SELECT * FROM store_config WHERE id = 1');
        if (configRows.length === 0) {
            await connection.query('INSERT INTO store_config (id, store_mode, announcement) VALUES (1, "upcoming", "Welcome to Faith Over Fear")');
            console.log('✅ Default store_config initialized.');
        }

        // 2. Announcements Table (Optional/Separate)
        await connection.query(
            `CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                message TEXT
            )`
        );

        // 3. Orders Table (Align with requested schema)
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
                phone_number VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );

        // Rename logic for backward compatibility if column customer_phone exists
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM orders LIKE "customer_phone"');
            if (columns.length > 0) {
                await connection.query('ALTER TABLE orders CHANGE customer_phone phone_number VARCHAR(50)');
                console.log('✅ Renamed customer_phone to phone_number in orders table.');
            }
        } catch (colErr) {
            console.warn('⚠️  Could not rename customer_phone (might already be renamed or missing):', colErr.message);
        }

        console.log('✅ Database tables aligned with requested schema.');
        connection.release(); // Always release the connection back to the pool
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        // Optional: process.exit(1); // Exit if DB is critical
    }
})();

// 3. Export the pool
module.exports = pool;