-- Add default_quality_level_id to products
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_quality_level_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_products_default_quality ON products (default_quality_level_id);
COMMIT;
