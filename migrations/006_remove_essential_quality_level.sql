-- ============================================================
-- MIGRATION: Remove Essential quality level from production DB
-- ============================================================
-- This removes any legacy "Essential" quality level that may
-- still exist in the database from before the quality level
-- cleanup. Only Premium and Luxe should remain.

BEGIN;

-- Delete product_quality_prices linked to Essential quality level
DELETE FROM product_quality_prices
WHERE quality_level_id IN (
  SELECT id FROM quality_levels WHERE LOWER(name) = 'essential'
);

-- Delete Essential quality level itself
DELETE FROM quality_levels
WHERE LOWER(name) = 'essential';

COMMIT;

-- Verify remaining quality levels
-- SELECT * FROM quality_levels ORDER BY sort_order;
