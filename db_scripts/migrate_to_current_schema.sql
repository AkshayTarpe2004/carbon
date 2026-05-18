-- =============================================================================
-- migrate_to_current_schema.sql  (PostgreSQL)
-- =============================================================================
-- Upgrades an *existing* CarbonCalc database toward the definitions in
-- schema.sql and the JPA entities under backend/.../model/.
--
-- Safe to run more than once (idempotent where PostgreSQL allows).
--
-- Usage (example):
--   psql -U postgres -d carbon_tracker -f db_scripts/migrate_to_current_schema.sql
--
-- Backup your database before running in production.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) auth_tokens  (AuthToken.java: refresh_token, expires_at, user_id only)
-- -----------------------------------------------------------------------------
-- Older schema used: token, created_at — align with refresh_token, drop created_at.

ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_tokens' AND column_name = 'token'
  ) THEN
    UPDATE auth_tokens SET refresh_token = COALESCE(refresh_token, token::text) WHERE refresh_token IS NULL;
    ALTER TABLE auth_tokens DROP COLUMN token;
  END IF;
END $$;

ALTER TABLE auth_tokens DROP COLUMN IF EXISTS created_at;

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);

-- Rebuild user FK with ON DELETE CASCADE (name may vary — drop any FK on user_id)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'auth_tokens'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE auth_tokens DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  ALTER TABLE auth_tokens
    ADD CONSTRAINT auth_tokens_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2) badge_templates  (audit + metadata columns)
-- -----------------------------------------------------------------------------

ALTER TABLE badge_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE badge_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE badge_templates ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE badge_templates ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE badge_templates ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255);

-- Widen icon if it was very narrow
ALTER TABLE badge_templates ALTER COLUMN icon TYPE VARCHAR(255);

-- -----------------------------------------------------------------------------
-- 2b) marketplace_items  (rating removed from app model)
-- -----------------------------------------------------------------------------
ALTER TABLE marketplace_items DROP COLUMN IF EXISTS rating;

-- -----------------------------------------------------------------------------
-- 3) badges  (entity has no template_id)
-- -----------------------------------------------------------------------------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'badges'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) ILIKE '%template_id%'
  LOOP
    EXECUTE format('ALTER TABLE badges DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE badges DROP COLUMN IF EXISTS template_id;

-- -----------------------------------------------------------------------------
-- 4) goals  (baseline / reduction columns + tighter numeric + NOT NULL)
-- -----------------------------------------------------------------------------

ALTER TABLE goals ADD COLUMN IF NOT EXISTS baseline_emission NUMERIC(14,4);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_reduction_kg NUMERIC(14,4);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_reduction_kg NUMERIC(14,4);

DO $$
BEGIN
  ALTER TABLE goals ALTER COLUMN baseline_emission TYPE NUMERIC(14,4)
    USING baseline_emission::numeric(14,4);
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE goals ALTER COLUMN target_reduction_kg TYPE NUMERIC(14,4)
    USING target_reduction_kg::numeric(14,4);
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE goals ALTER COLUMN current_reduction_kg TYPE NUMERIC(14,4)
    USING current_reduction_kg::numeric(14,4);
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

UPDATE goals SET goal_title = COALESCE(NULLIF(trim(goal_title), ''), 'Goal') WHERE goal_title IS NULL;
ALTER TABLE goals ALTER COLUMN goal_title SET NOT NULL;

UPDATE goals SET status = COALESCE(NULLIF(trim(status), ''), 'ACTIVE') WHERE status IS NULL;
ALTER TABLE goals ALTER COLUMN status SET DEFAULT 'ACTIVE';
ALTER TABLE goals ALTER COLUMN status SET NOT NULL;

-- Widen category/timeframe if they were VARCHAR(50)
ALTER TABLE goals ALTER COLUMN category TYPE VARCHAR(255);
ALTER TABLE goals ALTER COLUMN timeframe TYPE VARCHAR(255);

-- -----------------------------------------------------------------------------
-- 5) carbon_logs  (Double fields: distance_per_day, monthly_electricity)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  ALTER TABLE carbon_logs ALTER COLUMN distance_per_day TYPE double precision
    USING distance_per_day::double precision;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE carbon_logs ALTER COLUMN monthly_electricity TYPE double precision
    USING monthly_electricity::double precision;
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN others THEN NULL;
END $$;

-- Optional: widen varchar lifestyle fields to match JPA defaults
ALTER TABLE carbon_logs ALTER COLUMN transport_mode TYPE VARCHAR(255);
ALTER TABLE carbon_logs ALTER COLUMN fuel_type TYPE VARCHAR(255);
ALTER TABLE carbon_logs ALTER COLUMN diet_type TYPE VARCHAR(255);
ALTER TABLE carbon_logs ALTER COLUMN eating_out_frequency TYPE VARCHAR(255);

-- Frontend now uses diet options VEG / NON_VEG only.
-- Normalize legacy VEGAN rows to VEG to keep historical data consistent.
UPDATE carbon_logs
SET diet_type = 'VEG'
WHERE UPPER(COALESCE(diet_type, '')) = 'VEGAN';

-- -----------------------------------------------------------------------------
-- 6) surveys  (Survey.java — not JSON answers)
-- -----------------------------------------------------------------------------
-- New shape: transport_mode, diet_type, energy_usage, frequency, created_at, user_id.
-- If you had an "answers" JSONB column, it is dropped after adding replacements.
-- (JSON → relational data is not auto-migrated.)

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(255);
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS diet_type VARCHAR(255);
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS energy_usage DOUBLE PRECISION;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS frequency TEXT;

ALTER TABLE surveys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- Frontend now uses diet options VEG / NON_VEG only.
-- Normalize legacy VEGAN rows to VEG to keep historical data consistent.
UPDATE surveys
SET diet_type = 'VEG'
WHERE UPPER(COALESCE(diet_type, '')) = 'VEGAN';

-- user_id may already exist; allow NULL to match entity (optional user)
DO $$
BEGIN
  ALTER TABLE surveys ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

ALTER TABLE surveys DROP COLUMN IF EXISTS answers;

-- -----------------------------------------------------------------------------
-- 7) transactions  (carbon_offset + FK user CASCADE)
-- -----------------------------------------------------------------------------

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS carbon_offset NUMERIC(38,2) NOT NULL DEFAULT 0;

UPDATE transactions SET carbon_offset = 0 WHERE carbon_offset IS NULL;

UPDATE transactions SET status = 'SUCCESS' WHERE status IS NULL;
ALTER TABLE transactions ALTER COLUMN status SET DEFAULT 'SUCCESS';
DO $$
BEGIN
  ALTER TABLE transactions ALTER COLUMN status SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'transactions'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  ALTER TABLE transactions
    ADD CONSTRAINT transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 8) notifications  (FK user_id ON DELETE CASCADE for targeted rows)
-- -----------------------------------------------------------------------------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'notifications'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE notifications DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 9) carbon_logs  (FK user_id CASCADE — if FK exists, refresh)
-- -----------------------------------------------------------------------------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'carbon_logs'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE carbon_logs DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  ALTER TABLE carbon_logs
    ADD CONSTRAINT carbon_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 10) surveys  (FK user_id CASCADE)
-- -----------------------------------------------------------------------------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'surveys'
      AND c.contype = 'f'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER TABLE surveys DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  ALTER TABLE surveys
    ADD CONSTRAINT surveys_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 11) weekly_leaderboard — snapshot stores summed carbon_offset from SUCCESS purchases
-- -----------------------------------------------------------------------------

ALTER TABLE weekly_leaderboard
  ADD COLUMN IF NOT EXISTS marketplace_carbon_offset DOUBLE PRECISION NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_leaderboard' AND column_name = 'emission_reduction'
  ) THEN
    EXECUTE
      'UPDATE weekly_leaderboard SET marketplace_carbon_offset = COALESCE(emission_reduction::double precision, 0)';
  END IF;
END $$;

ALTER TABLE weekly_leaderboard DROP COLUMN IF EXISTS emission_reduction;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'weekly_leaderboard' AND column_name = 'marketplace_purchases'
  ) THEN
    EXECUTE
      'UPDATE weekly_leaderboard SET marketplace_carbon_offset = COALESCE(marketplace_purchases, 0)::double precision';
    ALTER TABLE weekly_leaderboard DROP COLUMN marketplace_purchases;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 12) contact_messages — admin read / replied flag (ContactMessage.readFlag)
-- -----------------------------------------------------------------------------

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- -----------------------------------------------------------------------------
-- 13) contact_messages — stored admin reply (for “View reply” in dashboard)
-- -----------------------------------------------------------------------------

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_subject VARCHAR(500);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_body TEXT;

-- -----------------------------------------------------------------------------
-- Done. Verify with: \d+ table_name  in psql
-- =============================================================================
