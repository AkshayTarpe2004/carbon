-- =============================================================================
-- seed_two_users_akshay.sql (PostgreSQL)
-- =============================================================================
-- Registers two users (or updates password if email already exists):
--
--   1. s22_tarpe_akshay@mgmcen.ac.in   Password: Akshay@12
--   2. akshaytarpe5@gmail.com          Password: Akshay@12
--
-- Run:
--   psql -U postgres -d carbon_tracker -f db_scripts/seed_two_users_akshay.sql
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (name, email, password, created_at, role, active)
VALUES
  (
    'Akshay Tarpe',
    's22_tarpe_akshay@mgmcen.ac.in',
    crypt('Akshay@12', gen_salt('bf', 10)),
    CURRENT_TIMESTAMP,
    'USER',
    TRUE
  ),
  (
    'Akshay Tarpe',
    'akshaytarpe5@gmail.com',
    crypt('Akshay@12', gen_salt('bf', 10)),
    CURRENT_TIMESTAMP,
    'USER',
    TRUE
  )
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = 'USER',
    active = TRUE;

COMMIT;

-- Verify
-- SELECT id, name, email, role, active, created_at FROM users
-- WHERE email IN ('s22_tarpe_akshay@mgmcen.ac.in', 'akshaytarpe5@gmail.com');
