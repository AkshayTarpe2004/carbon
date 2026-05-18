-- Grant admin access to an existing user (PostgreSQL)
-- Table name is "users" (plural), matching User.java @Table(name = "users").
--
-- The app treats role as admin when it equals ADMIN (case-insensitive), e.g.:
--   AdminAuditLogService.isAdminRole(...)
--
-- Usage (pick ONE approach):
--
--   psql -U postgres -d carbon_tracker -f db_scripts/set_admin_role.sql
--   (edit the email below first), or run the UPDATE in any SQL client.

-- By email (recommended)
UPDATE users
SET role = 'ADMIN'
WHERE lower(trim(email)) = lower(trim('akshaytarpe5@gmail.com'));

-- Optional: by user id instead
-- UPDATE users SET role = 'ADMIN' WHERE id = 1;

-- Verify
-- SELECT id, email, name, role, active FROM users WHERE role ILIKE 'admin';

-- Rows affected should be 1. If 0, check the email spelling and database name (\c).
