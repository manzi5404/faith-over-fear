-- ============================================================
-- MIGRATION 005: Seed data + verification queries
-- ============================================================
BEGIN;

-- Ensure default quality levels exist (legacy, not used by new backend)
INSERT INTO quality_levels (name, description, sort_order, is_active) VALUES
    ('Essential', 'Everyday tees, solid quality, standard cotton.', 1, TRUE),
    ('Premium', 'Softer fabrics, better fit, stronger collar and seams.', 2, TRUE),
    ('Luxe', 'High-end fabrics, very soft handfeel, best construction.', 3, TRUE)
ON CONFLICT DO NOTHING;

-- Seed store config singleton
INSERT INTO store_config (id, store_mode, announcement)
VALUES (1, 'closed', 'Welcome to Faith Over Fear')
ON CONFLICT (id) DO NOTHING;

-- Seed default settings
INSERT INTO settings (key, value) VALUES ('purchasingDisabled', 'false'), ('isRestocking', 'false')
ON CONFLICT (key) DO NOTHING;

-- Seed announcement singleton
INSERT INTO announcements (id, title, message, button_text, is_enabled, version, status)
VALUES (1, 'Welcome to F>F', 'New drops are coming.', 'SHOP THE DROP', FALSE, 1, 'live')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;
-- SELECT * FROM quality_levels;
-- SELECT * FROM store_config;
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;
