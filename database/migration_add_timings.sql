-- ============================================================
-- MIGRATION: Add opening_time and closing_time to museums
-- Run this if you already have an existing database.
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$ idiom).
-- ============================================================

DO $$
BEGIN
    -- opening_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='museums' AND column_name='opening_time'
    ) THEN
        ALTER TABLE museums ADD COLUMN opening_time VARCHAR(10) DEFAULT '09:00';
    END IF;

    -- closing_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='museums' AND column_name='closing_time'
    ) THEN
        ALTER TABLE museums ADD COLUMN closing_time VARCHAR(10) DEFAULT '17:00';
    END IF;
END $$;

-- ============================================================
-- NOTES ON EXISTING staff_pin COLUMN:
-- The staff_pin column should already exist from the main schema.
-- If not, add it with:
--   ALTER TABLE museums ADD COLUMN staff_pin VARCHAR(4) NOT NULL DEFAULT LPAD(FLOOR(RANDOM()*9000+1000)::TEXT, 4, '0');
-- ============================================================
