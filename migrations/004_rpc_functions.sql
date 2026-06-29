-- ============================================================
-- MIGRATION 004: RPC Functions for atomic operations
-- ============================================================
BEGIN;

-- Atomically reserve stock: decrements variant stock by quantity
-- Returns the updated row, or NULL if insufficient stock
CREATE OR REPLACE FUNCTION reserve_stock(p_variant_id BIGINT, p_quantity INTEGER)
RETURNS product_variants AS $$
DECLARE
    updated_row product_variants;
BEGIN
    UPDATE product_variants
    SET stock = stock - p_quantity
    WHERE id = p_variant_id AND stock >= p_quantity
    RETURNING * INTO updated_row;

    IF updated_row.id IS NULL THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: variant_id=%, requested=%', p_variant_id, p_quantity;
    END IF;

    RETURN updated_row;
END;
$$ LANGUAGE plpgsql;

-- Atomically return stock to variant (cancellation)
CREATE OR REPLACE FUNCTION return_stock(p_variant_id BIGINT, p_quantity INTEGER)
RETURNS product_variants AS $$
DECLARE
    updated_row product_variants;
BEGIN
    UPDATE product_variants
    SET stock = stock + p_quantity
    WHERE id = p_variant_id
    RETURNING * INTO updated_row;

    RETURN updated_row;
END;
$$ LANGUAGE plpgsql;

-- Verify payment atomically: transitions order from pending_payment to paid
-- Idempotent: returns current state if already verified
CREATE OR REPLACE FUNCTION verify_payment(p_order_id BIGINT, p_payment_reference VARCHAR, p_payment_method VARCHAR)
RETURNS orders AS $$
DECLARE
    updated_row orders;
BEGIN
    UPDATE orders
    SET status = 'paid',
        payment_reference = p_payment_reference,
        payment_method = p_payment_method,
        updated_at = NOW()
    WHERE id = p_order_id AND status = 'pending_payment'
    RETURNING * INTO updated_row;

    IF updated_row.id IS NULL THEN
        SELECT * INTO updated_row FROM orders WHERE id = p_order_id;
        IF updated_row.status = 'paid' THEN
            RETURN updated_row;
        END IF;
        RAISE EXCEPTION 'VERIFICATION_FAILED: order_id=%, current_status=%', p_order_id, updated_row.status;
    END IF;

    RETURN updated_row;
END;
$$ LANGUAGE plpgsql;

-- Activate a drop: close all others, open selected
CREATE OR REPLACE FUNCTION activate_drop(p_drop_id BIGINT)
RETURNS drops AS $$
DECLARE
    updated_row drops;
BEGIN
    UPDATE drops SET status = 'closed' WHERE status = 'live' AND id != p_drop_id;

    UPDATE drops
    SET status = 'live', updated_at = NOW()
    WHERE id = p_drop_id
    RETURNING * INTO updated_row;

    IF updated_row.id IS NULL THEN
        RAISE EXCEPTION 'ACTIVATE_FAILED: drop_id=% not found', p_drop_id;
    END IF;

    RETURN updated_row;
END;
$$ LANGUAGE plpgsql;

-- Batch mark waitlist entries as notified
CREATE OR REPLACE FUNCTION mark_waitlist_notified(p_drop_id BIGINT)
RETURNS INTEGER AS $$
BEGIN
    UPDATE waitlist
    SET notified = TRUE
    WHERE notified = FALSE AND id IN (
        SELECT id FROM waitlist WHERE notified = FALSE ORDER BY created_at ASC LIMIT 1000
    );
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMIT;
