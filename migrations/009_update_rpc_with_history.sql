-- ============================================================
-- MIGRATION 009: Update RPC functions with inventory history
-- ============================================================
BEGIN;

-- Updated reserve_stock that also records history
CREATE OR REPLACE FUNCTION reserve_stock(p_variant_id BIGINT, p_quantity INTEGER, p_order_id BIGINT DEFAULT NULL)
RETURNS product_variants AS $$
DECLARE
    updated_row product_variants;
    prev_stock INTEGER;
BEGIN
    SELECT stock INTO prev_stock FROM product_variants WHERE id = p_variant_id;

    UPDATE product_variants
    SET stock = stock - p_quantity
    WHERE id = p_variant_id AND stock >= p_quantity
    RETURNING * INTO updated_row;

    IF updated_row.id IS NULL THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: variant_id=%, requested=%, available=%', p_variant_id, p_quantity, prev_stock;
    END IF;

    INSERT INTO inventory_history (product_variant_id, order_id, change_amount, previous_stock, new_stock, reason)
    VALUES (p_variant_id, p_order_id, -p_quantity, prev_stock, updated_row.stock, 'reserve');

    RETURN updated_row;
END;
$$ LANGUAGE plpgsql;

-- Updated return_stock that also records history
CREATE OR REPLACE FUNCTION return_stock(p_variant_id BIGINT, p_quantity INTEGER, p_order_id BIGINT DEFAULT NULL)
RETURNS product_variants AS $$
DECLARE
    updated_row product_variants;
    prev_stock INTEGER;
BEGIN
    SELECT stock INTO prev_stock FROM product_variants WHERE id = p_variant_id;

    UPDATE product_variants
    SET stock = stock + p_quantity
    WHERE id = p_variant_id
    RETURNING * INTO updated_row;

    INSERT INTO inventory_history (product_variant_id, order_id, change_amount, previous_stock, new_stock, reason)
    VALUES (p_variant_id, p_order_id, p_quantity, prev_stock, updated_row.stock, 'cancellation');

    RETURN updated_row;
END;
$$ LANGUAGE plpgsql;

COMMIT;
