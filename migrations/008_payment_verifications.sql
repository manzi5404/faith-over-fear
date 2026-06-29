-- ============================================================
-- MIGRATION 008: Payment Verification Records
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS payment_verifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL,
    verified_by BIGINT NOT NULL,
    proof_url VARCHAR(512),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'verified',
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_verifications_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_verifications_admin FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_payment_verification_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_order ON payment_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_admin ON payment_verifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON payment_verifications(status);

COMMIT;
