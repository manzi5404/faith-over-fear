-- ============================================================
-- MIGRATION 011: Fix users.id type to match Supabase Auth UUID
-- ============================================================
--
-- ROOT CAUSE: auth.service.js passes authData.user.id (a UUID string
-- from supabase.auth.signUp/signInWithPassword) to userRepo.create()
-- and userRepo.findById(). But users.id was defined as BIGINT
-- GENERATED ALWAYS AS IDENTITY, so UUID strings never matched.
--
-- This caused:
--   - Registration: insert fails silently or with type error
--   - Login: userRepo.findById() returns null → user.id → TypeError
--
-- FIX: Change users.id to UUID that matches auth.users.id.
-- ============================================================

BEGIN;

-- Drop foreign keys that reference users.id
ALTER TABLE password_resets DROP CONSTRAINT IF EXISTS fk_password_resets_user;
ALTER TABLE carts DROP CONSTRAINT IF EXISTS fk_cart_user;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notification_user;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_user;
ALTER TABLE payment_verifications DROP CONSTRAINT IF EXISTS fk_payment_verifications_admin;
ALTER TABLE inventory_history DROP CONSTRAINT IF EXISTS fk_inventory_history_admin;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_password_resets_token;
DROP INDEX IF EXISTS idx_cart_user;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_payment_verifications_admin;
DROP INDEX IF EXISTS idx_inventory_history_admin;

-- Change id column type from BIGINT to UUID
-- This aligns public.users.id with auth.users.id (both UUIDs)
ALTER TABLE users
  ALTER COLUMN id TYPE VARCHAR(255)
  USING id::VARCHAR(255);

-- Drop the old identity sequence
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- Re-add foreign keys referencing TEXT/UUID compatible column
ALTER TABLE password_resets
  ADD CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE carts
  ADD CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications
  ADD CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payment_verifications
  ADD CONSTRAINT fk_payment_verifications_admin
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE inventory_history
  ADD CONSTRAINT fk_inventory_history_admin
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- Re-add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_cart_user ON carts(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_payment_verifications_admin ON payment_verifications(verified_by);
CREATE INDEX idx_inventory_history_admin ON inventory_history(admin_id);

COMMIT;
