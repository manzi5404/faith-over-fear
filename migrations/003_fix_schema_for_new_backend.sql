-- ============================================================
-- MIGRATION 003: Schema fixes for new backend
-- ============================================================
BEGIN;

-- Add role to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_role_check CHECK (role IN ('admin', 'user'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add close_date to drops
ALTER TABLE drops ADD COLUMN IF NOT EXISTS close_date TIMESTAMPTZ;

-- Add slug to drops and products
ALTER TABLE drops ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create unique indexes for slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_drops_slug ON drops(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL,
    color VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    stock INTEGER NOT NULL DEFAULT 0,
    price_override NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_product_size_color UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock);

ALTER TABLE product_variants ADD CONSTRAINT check_stock_non_negative CHECK (stock >= 0);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id),
    UNIQUE(session_id)
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, product_variant_id),
    CONSTRAINT check_cart_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    source VARCHAR(100),
    notified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Drop old reservations table if it exists
DROP TABLE IF EXISTS reservations CASCADE;

-- Rewrite notifications table to match target schema
CREATE TABLE IF NOT EXISTS notifications_backup AS SELECT * FROM notifications;
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add updated_at to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMIT;
