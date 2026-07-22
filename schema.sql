-- =========================================================
-- FAITH OVER FEAR — Authoritative Database Schema
-- Generated from: models/*.js + db/init.js
-- Run in this exact order (foreign key dependency order)
-- =========================================================

-- 1. USERS
--    Source: models/user.js
--    Used by: orders.user_id, reservations.user_id, password_resets.user_id
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        DEFAULT NULL,
    name          VARCHAR(255)        DEFAULT NULL,
    google_id     VARCHAR(255) UNIQUE DEFAULT NULL,
    created_at    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. PASSWORD RESETS
--    Source: models/passwordReset.js
CREATE TABLE IF NOT EXISTS password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT         NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires_at DATETIME    NOT NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. DROPS  (collections / drop events)
--    Source: models/drop.js  +  db/init.js
--    CRITICAL: column is named `title` NOT `name`
--    image_url stores a plain URL string (NOT a JSON array)
CREATE TABLE IF NOT EXISTS drops (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255)                                           NOT NULL,
    description   TEXT                                                   DEFAULT NULL,
    image_url     VARCHAR(512)                                           DEFAULT NULL,
    release_date  DATETIME                                               DEFAULT NULL,
    status        ENUM('upcoming', 'reservation', 'live', 'closed')     DEFAULT 'upcoming',
    collection_id INT                                                    DEFAULT NULL,
    created_at    TIMESTAMP                                              DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4. PRODUCTS
--    Source: models/product.js
--    sizes, colors, image_urls are stored as JSON arrays (MySQL JSON type)
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    drop_id     INT            DEFAULT NULL,
    name        VARCHAR(255)   NOT NULL,
    description TEXT           DEFAULT NULL,
    price       DECIMAL(15, 2) NOT NULL,
    sizes       JSON           DEFAULT NULL,   -- e.g. ["S","M","L","XL"]
    colors      JSON           DEFAULT NULL,   -- e.g. ["Black","White"]
    image_urls  JSON           DEFAULT NULL,   -- e.g. ["https://...jpg"]
    is_active   TINYINT(1)     DEFAULT 1,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drop_id) REFERENCES drops(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 5. QUALITY_LEVELS
--    Source: models/productQualityPrice.js
CREATE TABLE IF NOT EXISTS quality_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 6. PRODUCT_QUALITY_PRICES
--    Source: models/productQualityPrice.js
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 7. ORDERS
--    Source: models/order.js
--    phone_number field (NOT phone — different from reservations)
CREATE TABLE IF NOT EXISTS orders (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT            DEFAULT NULL,
    product_id     INT            DEFAULT NULL,
    drop_id        INT            DEFAULT NULL,
    product_name      VARCHAR(255)   DEFAULT NULL,
    size              VARCHAR(50)    DEFAULT NULL,
    color             VARCHAR(50)    DEFAULT NULL,
    quantity          INT            DEFAULT 1,
    quality_level_id  INT            DEFAULT NULL,
    price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
    total_price       DECIMAL(15, 2) NOT NULL,
    status            ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50)    DEFAULT 'reservation',
    customer_name  VARCHAR(255)   DEFAULT NULL,
    customer_email VARCHAR(255)   DEFAULT NULL,
    phone_number   VARCHAR(50)    DEFAULT NULL,
    created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_quality_level (quality_level_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (drop_id)    REFERENCES drops(id)    ON DELETE SET NULL,
    FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 8. ORDER ITEMS
--    Source: models/orderItem.js
CREATE TABLE IF NOT EXISTS order_items (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    order_id          INT            NOT NULL,
    product_id        INT            DEFAULT NULL,
    product_name      VARCHAR(255)   DEFAULT NULL,
    quantity          INT            DEFAULT 1,
    size              VARCHAR(50)    DEFAULT NULL,
    color             VARCHAR(50)    DEFAULT NULL,
    quality_level_id  INT            DEFAULT NULL,
    price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
    total_price       DECIMAL(15, 2) DEFAULT NULL,
    price             DECIMAL(15, 2) DEFAULT NULL,
    INDEX idx_order_items_quality_level (quality_level_id),
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 9. RESERVATIONS
--    Source: controllers/reservationController.js + db/init.js
--    phone field (NOT phone_number — different from orders)
--    store_mode tracks the store state at time of reservation
CREATE TABLE IF NOT EXISTS reservations (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          DEFAULT NULL,
    full_name  VARCHAR(255) DEFAULT NULL,
    email      VARCHAR(255) DEFAULT NULL,
    phone      VARCHAR(50)  DEFAULT NULL,
    product_id        INT            DEFAULT NULL,
    product_name      VARCHAR(255)   DEFAULT NULL,
    size              VARCHAR(20)    DEFAULT NULL,
    color             VARCHAR(50)    DEFAULT NULL,
    quantity          INT            DEFAULT 1,
    quality_level_id  INT            DEFAULT NULL,
    price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
    store_mode        VARCHAR(50)    DEFAULT 'live',
    status     ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reservations_quality_level (quality_level_id),
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 8. STORE CONFIG  (single-row config table, always id=1)
--    Source: controllers/storeConfigController.js + db/init.js
CREATE TABLE IF NOT EXISTS store_config (
    id           INT PRIMARY KEY DEFAULT 1,
    store_mode   ENUM('live', 'reserve', 'closed') DEFAULT 'closed',
    announcement TEXT           DEFAULT NULL,
    updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the required single row
INSERT IGNORE INTO store_config (id, store_mode, announcement)
VALUES (1, 'closed', 'Welcome to Faith Over Fear');


-- 9. SETTINGS  (key-value store for app-wide feature flags)
--    Source: models/settings.js + controllers/settingsController.js
CREATE TABLE IF NOT EXISTS settings (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    `key`      VARCHAR(255) UNIQUE NOT NULL,
    `value`    VARCHAR(255)        NOT NULL,
    created_at TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default feature flags
INSERT IGNORE INTO settings (`key`, `value`) VALUES ('purchasingDisabled', 'false');
INSERT IGNORE INTO settings (`key`, `value`) VALUES ('isRestocking', 'false');


-- 10. ANNOUNCEMENTS  (single-row announcement banner, always id=1)
--     Source: models/announcement.js
CREATE TABLE IF NOT EXISTS announcements (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) DEFAULT NULL,
    message     TEXT         DEFAULT NULL,
    image_url   VARCHAR(512) DEFAULT NULL,
    button_text VARCHAR(50)  DEFAULT 'SHOP THE DROP',
    is_enabled  TINYINT(1)   DEFAULT 1,
    version     INT          DEFAULT 1,
    status      VARCHAR(50)  DEFAULT 'live',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed required single row so UPDATE never creates 0 affectedRows
INSERT IGNORE INTO announcements (id, title, message, button_text, is_enabled, version, status)
VALUES (1, 'Welcome to F>F', 'New drops are coming.', 'SHOP THE DROP', 0, 1, 'live');


-- 11. NOTIFICATIONS  (admin notification inbox)
--     Source: models/notification.js
--     CRITICAL: column is `description` NOT `message`, and `is_seen` NOT `is_read`
CREATE TABLE IF NOT EXISTS notifications (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    type         VARCHAR(50)  DEFAULT NULL,   -- 'reservation' | 'message' | 'order'
    reference_id INT          DEFAULT NULL,
    title        VARCHAR(255) DEFAULT NULL,
    description  TEXT         DEFAULT NULL,   -- NOT 'message'
    is_seen      TINYINT(1)   DEFAULT 0,      -- NOT 'is_read'
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 12. CONTACT MESSAGES
--     Source: models/contactMessage.js
CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) DEFAULT NULL,
    email      VARCHAR(255) DEFAULT NULL,
    subject    VARCHAR(255) DEFAULT 'General Inquiry',
    message    TEXT         DEFAULT NULL,
    status     VARCHAR(50)  DEFAULT 'unread',   -- 'unread' | 'read' | 'replied'
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
