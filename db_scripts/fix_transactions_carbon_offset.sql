-- Run once against your APP database (not the default "postgres" database).
-- In psql, connect first — name must match the DB in spring.datasource.url (…/5432/THIS_NAME):
--   \c carbon_tracker
--   or: \c carbontracker
-- Then: \i path/to/fix_transactions_carbon_offset.sql
--
-- (JPA entity requires carbon_offset; older schema.sql omitted it.)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS carbon_offset NUMERIC(38,2) NOT NULL DEFAULT 0;

UPDATE transactions SET carbon_offset = 0 WHERE carbon_offset IS NULL;
