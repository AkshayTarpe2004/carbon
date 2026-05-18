-- CarbonCalc / CarbonTracker reference schema (PostgreSQL)
-- Kept in sync with JPA entities under:
--   backend/src/main/java/com/carbon/carbontracker/model/
--
-- For new databases you can run this script as-is.
-- For an existing database, run first: migrate_to_current_schema.sql
-- The app may also use spring.jpa.hibernate.ddl-auto=update to evolve tables.
--
-- Create database (run once manually, not inside this script):
--   CREATE DATABASE carbon_tracker;
--   \c carbon_tracker

-- ============================================================
--  USERS  (User.java @Table users)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                   BIGSERIAL PRIMARY KEY,
  name                 VARCHAR(255),
  email                VARCHAR(255) UNIQUE NOT NULL,
  password             VARCHAR(255),
  created_at           TIMESTAMP,
  reset_token          VARCHAR(255),
  reset_token_expiry   TIMESTAMP,
  -- Application roles: 'USER' (default), 'ADMIN' (dashboard / admin APIs).
  -- To promote a user: see set_admin_role.sql (UPDATE users SET role = 'ADMIN' WHERE ...).
  role                 VARCHAR(50) DEFAULT 'USER',
  active               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
--  AUTH TOKENS  (AuthToken.java @Table auth_tokens)
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_tokens (
  id             BIGSERIAL PRIMARY KEY,
  refresh_token  VARCHAR(255),
  expires_at     TIMESTAMP,
  user_id        BIGINT REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);

-- ============================================================
--  BADGE TEMPLATES  (BadgeTemplate.java @Table badge_templates)
-- ============================================================

CREATE TABLE IF NOT EXISTS badge_templates (
  id             BIGSERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL UNIQUE,
  code           VARCHAR(255) UNIQUE,
  description    TEXT,
  condition_text TEXT,
  icon           VARCHAR(255),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP,
  created_by     VARCHAR(255),
  updated_by     VARCHAR(255),
  ip_address     VARCHAR(255)
);

-- ============================================================
--  BADGES  (Badge.java @Table badges — no template FK on entity)
-- ============================================================

CREATE TABLE IF NOT EXISTS badges (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name   VARCHAR(255) NOT NULL,
  description  TEXT,
  awarded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);

-- ============================================================
--  GOALS  (Goal.java @Table goals)
-- ============================================================

CREATE TABLE IF NOT EXISTS goals (
  id                   BIGSERIAL PRIMARY KEY,
  user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_title           VARCHAR(255) NOT NULL,
  category             VARCHAR(255),
  reduction_target     INTEGER,
  timeframe            VARCHAR(255),
  description          TEXT,
  baseline_emission    NUMERIC(14,4),
  target_reduction_kg  NUMERIC(14,4),
  current_reduction_kg NUMERIC(14,4),
  target_emission      NUMERIC(10,2),
  current_emission     NUMERIC(10,2),
  progress_percentage  DOUBLE PRECISION,
  status               VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  start_date           DATE,
  end_date             DATE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ============================================================
--  CARBON LOGS  (CarbonLog.java @Table carbon_logs)
-- ============================================================

CREATE TABLE IF NOT EXISTS carbon_logs (
  id                     BIGSERIAL PRIMARY KEY,
  user_id                BIGINT REFERENCES users(id) ON DELETE CASCADE,
  date                   DATE,
  transport_emission     NUMERIC(19,2),
  food_emission          NUMERIC(19,2),
  energy_emission        NUMERIC(19,2),
  total_emission         NUMERIC(19,2),
  transport_mode         VARCHAR(255),
  distance_per_day       DOUBLE PRECISION,
  fuel_type              VARCHAR(255),
  diet_type              VARCHAR(255),
  meals_per_day          INTEGER,
  eating_out_frequency   VARCHAR(255),
  -- Stored value currently comes from survey conversion logic
  -- (user enters monthly kWh, app converts to daily-equivalent before save).
  monthly_electricity    DOUBLE PRECISION,
  renewable              BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_carbon_logs_user_date
  ON carbon_logs(user_id, date);

-- ============================================================
--  SURVEYS  (Survey.java @Table surveys)
-- ============================================================

CREATE TABLE IF NOT EXISTS surveys (
  id              BIGSERIAL PRIMARY KEY,
  transport_mode  VARCHAR(255),
  diet_type       VARCHAR(255),
  -- Mirrors current survey energy input after app-side conversion.
  energy_usage    DOUBLE PRECISION,
  frequency       TEXT,
  created_at      TIMESTAMP,
  user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);

-- ============================================================
--  CONTACT MESSAGES  (ContactMessage.java @Table contact_messages)
--  Public marketing contact form submissions (no user FK).
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id             BIGSERIAL PRIMARY KEY,
  sender_name    VARCHAR(255) NOT NULL,
  sender_email   VARCHAR(255) NOT NULL,
  subject        VARCHAR(500),
  message_body   TEXT NOT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT FALSE,
  reply_subject  VARCHAR(500),
  reply_body     TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages(created_at DESC);

-- ============================================================
--  MARKETPLACE ITEMS  (MarketplaceItem.java @Table marketplace_items)
-- ============================================================

CREATE TABLE IF NOT EXISTS marketplace_items (
  id                        BIGSERIAL PRIMARY KEY,
  item_name                 VARCHAR(255) NOT NULL,
  item_type                 VARCHAR(255),
  price                     NUMERIC(38,2) NOT NULL,
  description               VARCHAR(1000),
  carbon_offset_value       NUMERIC(38,2),
  badge                     VARCHAR(32),
  impact_progress_percent   INTEGER,
  price_unit                VARCHAR(64),
  header_icon               VARCHAR(32),
  banner_key                VARCHAR(64),
  created_at                TIMESTAMP NOT NULL,
  updated_at                TIMESTAMP,
  created_by                VARCHAR(255),
  updated_by                VARCHAR(255),
  ip_address                VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_type
  ON marketplace_items(item_type);

-- Optional legacy table (not mapped by current JPA)
CREATE TABLE IF NOT EXISTS marketplace (
  id                  BIGSERIAL PRIMARY KEY,
  item_name           VARCHAR(255) NOT NULL,
  item_type           VARCHAR(255),
  price               NUMERIC(38,2) NOT NULL,
  description         VARCHAR(1000),
  carbon_offset_value NUMERIC(38,2),
  created_at          TIMESTAMP NOT NULL
);

-- ============================================================
--  TRANSACTIONS  (Transaction.java @Table transactions)
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id                    BIGSERIAL PRIMARY KEY,
  amount                NUMERIC(38,2) NOT NULL,
  carbon_offset         NUMERIC(38,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMP,
  status                VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  marketplace_item_id   BIGINT NOT NULL REFERENCES marketplace_items(id),
  user_id               BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_marketplace_item_id
  ON transactions(marketplace_item_id);

-- ============================================================
--  NOTIFICATIONS  (Notification.java @Table notifications)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMP,
  is_read           BOOLEAN,
  message           VARCHAR(2000) NOT NULL,
  title             VARCHAR(500) NOT NULL,
  type              VARCHAR(255),
  user_id           BIGINT REFERENCES users(id) ON DELETE CASCADE,
  admin_name        VARCHAR(255),
  ip_address        VARCHAR(255),
  updated_at        TIMESTAMP,
  hidden_for_user   BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at);

-- ============================================================
--  ADMIN AUDIT LOGS  (AdminAuditLog.java @Table admin_audit_logs)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMP NOT NULL,
  admin_user_id  BIGINT,
  admin_name     VARCHAR(255),
  admin_email    VARCHAR(255),
  action         VARCHAR(200) NOT NULL,
  details        TEXT,
  ip_address     VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON admin_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id
  ON admin_audit_logs(admin_user_id);

-- ============================================================
--  WEEKLY LEADERBOARD  (WeeklyLeaderboard.java @Table weekly_leaderboard)
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_leaderboard (
  id                     BIGSERIAL PRIMARY KEY,
  week_start             DATE NOT NULL,
  week_end               DATE NOT NULL,
  user_id                BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name              VARCHAR(255) NOT NULL,
  rank_position          INTEGER NOT NULL,
  marketplace_carbon_offset DOUBLE PRECISION NOT NULL DEFAULT 0,
  goals_completed        INTEGER NOT NULL,
  badges_earned          INTEGER NOT NULL,
  score                  DOUBLE PRECISION NOT NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_week_start
  ON weekly_leaderboard(week_start);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_week_start_rank
  ON weekly_leaderboard(week_start, rank_position);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_user_week
  ON weekly_leaderboard(user_id, week_start);
