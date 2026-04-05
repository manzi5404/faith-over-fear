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
                title VARCHAR(255) NOT NULL,
                description TEXT,
                image_url VARCHAR(255),
                release_date DATETIME,
                status ENUM('upcoming', 'reservation', 'live', 'closed') DEFAULT 'upcoming',
                collection_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migration: Standardize on 'title', rename from 'name' if necessary
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM drops');
            const colNames = columns.map(c => c.Field);
            
            // Critical Rename: if 'name' exists but 'title' does not
            if (colNames.includes('name') && !colNames.includes('title')) {
                await connection.query('ALTER TABLE drops CHANGE COLUMN name title VARCHAR(255) NOT NULL');
                console.log('✅ Renamed "name" column to "title" in drops table.');
            }
            
            if (!colNames.includes('description')) await connection.query('ALTER TABLE drops ADD COLUMN description TEXT AFTER title');
            if (!colNames.includes('image_url')) await connection.query('ALTER TABLE drops ADD COLUMN image_url VARCHAR(255) AFTER description');
            if (!colNames.includes('release_date')) await connection.query('ALTER TABLE drops ADD COLUMN release_date DATETIME AFTER image_url');
            
            console.log('✅ Drops table standardized on "title" and metadata columns.');
        } catch (migErr) {
            console.warn('⚠️  Drops naming migration failed:', migErr.message);
        }

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

        // 3b. Quality Levels Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS quality_levels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description VARCHAR(255) DEFAULT NULL,
                sort_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        const [qualityRows] = await connection.query('SELECT id FROM quality_levels LIMIT 1');
        if (qualityRows.length === 0) {
            await connection.query(
                `INSERT INTO quality_levels (name, description, sort_order, is_active)
                 VALUES
                    ('Basic', 'Entry-level quality for budget-conscious shoppers', 1, 1),
                    ('Standard', 'Balanced quality and value for everyday wear', 2, 1),
                    ('Premium', 'Highest quality with premium materials and finishes', 3, 1)`
            );
            console.log('✅ Seeded default quality levels');
        }

        // 3c. Product Quality Prices Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_quality_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                quality_level_id INT NOT NULL,
                price DECIMAL(15, 2) NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_product_quality (product_id, quality_level_id),
                INDEX idx_product_quality_prices_product (product_id),
                INDEX idx_product_quality_prices_quality (quality_level_id),
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE RESTRICT
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

        // 4b. Settings Table (For boolean flags and general config)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(255) UNIQUE NOT NULL,
                \`value\` VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Ensure default settings exist
        const defaultSettings = [
            { key: 'purchasingDisabled', value: 'false' },
            { key: 'isRestocking', value: 'false' }
        ];

        for (const setting of defaultSettings) {
            const [rows] = await connection.query('SELECT * FROM settings WHERE `key` = ?', [setting.key]);
            if (rows.length === 0) {
                await connection.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [setting.key, setting.value]);
                console.log(`✅ Default setting created: ${setting.key} = ${setting.value}`);
            }
        }

        // 5. Orders Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                product_id INT,
                drop_id INT,
                product_name VARCHAR(255),
                size VARCHAR(20),
                color VARCHAR(50),
                quantity INT DEFAULT 1,
                quality_level_id INT DEFAULT NULL,
                price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
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

        // Migration: Ensure orders table has quality and purchase fields for the updated model
        try {
            const [orderColumns] = await connection.query('SHOW COLUMNS FROM orders');
            const orderFields = orderColumns.map(c => c.Field);
            if (!orderFields.includes('quality_level_id')) {
                await connection.query('ALTER TABLE orders ADD COLUMN quality_level_id INT DEFAULT NULL AFTER quantity');
            }
            if (!orderFields.includes('price_at_purchase')) {
                await connection.query('ALTER TABLE orders ADD COLUMN price_at_purchase DECIMAL(15, 2) DEFAULT NULL AFTER quality_level_id');
            }
            console.log('✅ Orders schema verified for quality and purchase fields');
        } catch (orderMigrationErr) {
            console.warn('⚠️  Orders schema migration warning:', orderMigrationErr.message);
        }

        // 5b. Order Items Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT DEFAULT NULL,
                product_name VARCHAR(255) DEFAULT NULL,
                quantity INT DEFAULT 1,
                size VARCHAR(50) DEFAULT NULL,
                color VARCHAR(50) DEFAULT NULL,
                quality_level_id INT DEFAULT NULL,
                price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
                total_price DECIMAL(15, 2) DEFAULT NULL,
                price DECIMAL(15, 2) DEFAULT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migration: Ensure order_items columns exist for updated backend logic
        try {
            const [orderItemColumns] = await connection.query('SHOW COLUMNS FROM order_items');
            const orderItemFields = orderItemColumns.map(c => c.Field);
            if (!orderItemFields.includes('product_name')) {
                await connection.query('ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255) DEFAULT NULL AFTER product_id');
            }
            if (!orderItemFields.includes('color')) {
                await connection.query('ALTER TABLE order_items ADD COLUMN color VARCHAR(50) DEFAULT NULL AFTER size');
            }
            if (!orderItemFields.includes('quality_level_id')) {
                await connection.query('ALTER TABLE order_items ADD COLUMN quality_level_id INT DEFAULT NULL AFTER color');
            }
            if (!orderItemFields.includes('price_at_purchase')) {
                await connection.query('ALTER TABLE order_items ADD COLUMN price_at_purchase DECIMAL(15, 2) DEFAULT NULL AFTER quality_level_id');
            }
            if (!orderItemFields.includes('total_price')) {
                await connection.query('ALTER TABLE order_items ADD COLUMN total_price DECIMAL(15, 2) DEFAULT NULL AFTER price_at_purchase');
            }
            console.log('✅ order_items schema verified for quality and pricing fields');
        } catch (orderItemsMigrationErr) {
            console.warn('⚠️  order_items migration warning:', orderItemsMigrationErr.message);
        }

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
                product_name VARCHAR(255) DEFAULT NULL,
                size VARCHAR(20),
                color VARCHAR(50),
                quantity INT DEFAULT 1,
                quality_level_id INT DEFAULT NULL,
                price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
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

            const [reservationColumns] = await connection.query('SHOW COLUMNS FROM reservations');
            const reservationFields = reservationColumns.map(c => c.Field);
            if (!reservationFields.includes('product_name')) {
                await connection.query('ALTER TABLE reservations ADD COLUMN product_name VARCHAR(255) DEFAULT NULL AFTER product_id');
            }
            if (!reservationFields.includes('quality_level_id')) {
                await connection.query('ALTER TABLE reservations ADD COLUMN quality_level_id INT DEFAULT NULL AFTER color');
            }
            if (!reservationFields.includes('price_at_purchase')) {
                await connection.query('ALTER TABLE reservations ADD COLUMN price_at_purchase DECIMAL(15, 2) DEFAULT NULL AFTER quality_level_id');
            }

            const [cols] = await connection.query('SHOW COLUMNS FROM reservations LIKE "updated_at"');
            if (cols.length === 0) {
                await connection.query('ALTER TABLE reservations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
            }
            console.log('✅ Reservations schema verified (status, store_mode, and new purchase fields ensured)');
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
