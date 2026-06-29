-- ============================================================
-- MIGRATION 007: Inventory History System
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS inventory_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_variant_id BIGINT NOT NULL,
    order_id BIGINT,
    admin_id BIGINT,
    change_amount INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_inventory_history_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_inventory_history_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_inventory_change_amount CHECK (change_amount <> 0),
    CONSTRAINT chk_inventory_stock_non_negative CHECK (previous_stock >= 0 AND new_stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_history_variant ON inventory_history(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_order ON inventory_history(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_reason ON inventory_history(reason);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);

COMMIT;
