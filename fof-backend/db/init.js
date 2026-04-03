const pool = require('./connection');

async function initializeDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('📦 Initializing Database Tables...');

        // 1. Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                name VARCHAR(255),
                google_id VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 2. Drops Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS drops (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                status ENUM('upcoming', 'reservation', 'live', 'closed') DEFAULT 'upcoming',
                collection_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 3. Products Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                drop_id INT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(15, 2) NOT NULL,
                sizes JSON,
                colors JSON,
                image_urls JSON,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (drop_id) REFERENCES drops(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 4. Store Config Table (Modes: live, reserve, closed)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS store_config (
                id INT PRIMARY KEY DEFAULT 1,
                store_mode ENUM('live', 'reserve', 'closed') DEFAULT 'closed',
                announcement TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migration: Ensure ENUM values are correct on existing tables
        try {
            await connection.query("ALTER TABLE store_config MODIFY COLUMN store_mode ENUM('live', 'reserve', 'closed') DEFAULT 'closed'");
            console.log('✅ store_config ENUM updated to: live, reserve, closed');
        } catch (alterErr) {
            console.warn('⚠️  Could not alter store_config ENUM (it might already be correct):', alterErr.message);
        }

        // Ensure default config exists
        const [configRows] = await connection.query('SELECT * FROM store_config WHERE id = 1');
        if (configRows.length === 0) {
            await connection.query('INSERT INTO store_config (id, store_mode, announcement) VALUES (1, "closed", "Welcome to Faith Over Fear")');
        }

        // 5. Orders Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                product_id INT,
                drop_id INT,
                customer_name VARCHAR(255),
                customer_email VARCHAR(255),
                phone_number VARCHAR(50),
                total_price DECIMAL(15, 2),
                status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
                payment_method VARCHAR(50) DEFAULT 'reservation',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migration: Unified Status ENUM for Orders
        try {
            await connection.query("UPDATE orders SET status = 'confirmed' WHERE status = 'contacted'");
            await connection.query("UPDATE orders SET status = 'completed' WHERE status = 'delivered'");
            await connection.query("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending'");
            console.log('✅ Orders status ENUM unified & migrated');
        } catch (migErr) {
            console.warn('⚠️  Orders status migration warning:', migErr.message);
        }

        // 6. Reservations Table (Critical for stability)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                full_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                product_id INT,
                size VARCHAR(20),
                color VARCHAR(50),
                quantity INT DEFAULT 1,
                store_mode VARCHAR(50) DEFAULT 'live',
                status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migration: Ensure reservations table has updated_at, store_mode, and correct ENUM statuses
        try {
            await connection.query("UPDATE reservations SET status = 'completed' WHERE status = 'fulfilled'");
            await connection.query("ALTER TABLE reservations MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending'");
            
            // Check and Rename phone_number to phone if exists
            const [phoneCols] = await connection.query('SHOW COLUMNS FROM reservations LIKE "phone_number"');
            if (phoneCols.length > 0) {
                await connection.query('ALTER TABLE reservations CHANGE COLUMN phone_number phone VARCHAR(50)');
                console.log('✅ Reservations column phone_number -> phone renamed');
            }

            // Check and Add store_mode if missing
            const [modeCols] = await connection.query('SHOW COLUMNS FROM reservations LIKE "store_mode"');
            if (modeCols.length === 0) {
                await connection.query('ALTER TABLE reservations ADD COLUMN store_mode VARCHAR(50) DEFAULT "live" AFTER quantity');
                console.log('✅ Reservations column store_mode added');
            }

            const [cols] = await connection.query('SHOW COLUMNS FROM reservations LIKE "updated_at"');
            if (cols.length === 0) {
                await connection.query('ALTER TABLE reservations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
            }
            console.log('✅ Reservations schema verified (status, store_mode & updated_at ensured)');
        } catch (migErr) {
            console.warn('⚠️  Reservations migration warning:', migErr.message);
        }

        // 7. Announcements Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                message TEXT,
                image_url VARCHAR(255),
                button_text VARCHAR(50) DEFAULT 'SHOP THE DROP',
                is_enabled TINYINT(1) DEFAULT 1,
                version INT DEFAULT 1,
                status VARCHAR(50) DEFAULT 'live',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migration: Ensure all columns exist 
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM announcements');
            const colNames = columns.map(c => c.Field);
            
            if (!colNames.includes('image_url')) await connection.query('ALTER TABLE announcements ADD COLUMN image_url VARCHAR(255) AFTER message');
            if (!colNames.includes('button_text')) await connection.query('ALTER TABLE announcements ADD COLUMN button_text VARCHAR(50) DEFAULT "SHOP THE DROP" AFTER image_url');
            if (!colNames.includes('is_enabled')) await connection.query('ALTER TABLE announcements ADD COLUMN is_enabled TINYINT(1) DEFAULT 1 AFTER button_text');
            if (!colNames.includes('version')) await connection.query('ALTER TABLE announcements ADD COLUMN version INT DEFAULT 1 AFTER is_enabled');
            if (!colNames.includes('status')) await connection.query('ALTER TABLE announcements ADD COLUMN status VARCHAR(50) DEFAULT "live" AFTER version');
            
            console.log('✅ Announcements table schema verified (all columns present).');
        } catch (migErr) {
            console.warn('⚠️  Announcements table migration warning:', migErr.message);
        }

        // 8. Notifications Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50),
                reference_id INT,
                title VARCHAR(255),
                message TEXT,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        console.log('✅ Database Schema verified and tables ensured.');

    } catch (error) {
        console.error('❌ Database Initialization Error:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { initializeDatabase };
