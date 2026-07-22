-- =========================================================
-- Migration: Align Database with Backend Quality Level Support
-- Faith Over Fear E-Commerce Platform
--
-- This migration updates the database schema to match the current
-- backend source of truth. It adds quality level master data,
-- product quality pricing, and supports selected quality persistence
-- for orders and reservations.
--
-- IMPORTANT: This migration is SAFE to run on existing databases.
-- It uses IF NOT EXISTS for new columns and indexes.
-- =========================================================

-- 1. QUALITY_LEVELS TABLE
--    Master table for quality levels.
CREATE TABLE IF NOT EXISTS quality_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default quality levels only if the table is empty.
INSERT IGNORE INTO quality_levels (id, name, description, sort_order, is_active) VALUES
(1, 'Basic', 'Entry-level quality for budget-conscious shoppers', 1, 1),
(2, 'Standard', 'Balanced quality and value for everyday wear', 2, 1),
(3, 'Premium', 'Highest quality with premium materials and finishes', 3, 1);

-- 2. PRODUCT_QUALITY_PRICES TABLE
--    Junction table linking products to quality levels with their prices.
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
    CONSTRAINT fk_product_quality_prices_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_quality_prices_quality FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ALIGN ORDERS TABLE WITH BACKEND MODEL
--    Backend order creation expects product metadata, size/color, quantity, and quality tracking.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS quality_level_id INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS price_at_purchase DECIMAL(15, 2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_quality_level ON orders(quality_level_id);
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_quality_level FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE SET NULL;

-- 4. ALIGN RESERVATIONS TABLE WITH QUALITY SUPPORT
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS quality_level_id INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS price_at_purchase DECIMAL(15, 2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_quality_level ON reservations(quality_level_id);
ALTER TABLE reservations
    ADD CONSTRAINT fk_reservations_quality_level FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE SET NULL;

-- 5. ORDER ITEMS QUALITY SUPPORT
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS quality_level_id INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS price_at_purchase DECIMAL(15, 2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS total_price DECIMAL(15, 2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_quality_level ON order_items(quality_level_id);
ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_quality_level FOREIGN KEY (quality_level_id) REFERENCES quality_levels(id) ON DELETE SET NULL;

-- =========================================================
-- MIGRATION COMPLETE
-- =========================================================
--
-- Summary of changes:
-- 1. Added quality_levels table.
-- 2. Seeded default quality levels.
-- 3. Added product_quality_prices table with unique product/quality pricing.
-- 4. Added missing order metadata columns required by backend order creation.
-- 5. Added quality_level_id support to orders, reservations, and order_items.
--
-- Notes:
-- - The backend product service expects quality_prices on products.
-- - The backend order flow now has DB support for quality_level_id.
-- - Quantities, size, color, and product_name fields are now aligned with createOrder().
-- =========================================================
