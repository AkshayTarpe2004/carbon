-- =============================================================================
-- patch_demo_goals_coherence.sql
-- One-off fix for goals already seeded with old (incorrect) timeframes and
-- progress. Deletes ALL goals for demo users and re-inserts using the same
-- rules as section 5 of seed_demo_25_users_full.sql.
--
-- Run: psql -U postgres -d carbon_tracker -f db_scripts/patch_demo_goals_coherence.sql
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH demo_ids AS (
  SELECT id
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM goals
WHERE user_id IN (SELECT id FROM demo_ids);

-- Same INSERT as seed_demo_25_users_full.sql (section 5)
WITH demo_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
),
goal_slots AS (
  SELECT generate_series(1, 10) AS g
)
INSERT INTO goals (
  user_id, goal_title, category, reduction_target, timeframe, description,
  baseline_emission, target_reduction_kg, current_reduction_kg,
  target_emission, current_emission, progress_percentage, status,
  start_date, end_date, created_at
)
SELECT
  du.id,
  format(
    '%s - user %s - goal %s',
    CASE (gs.g % 3)
      WHEN 1 THEN 'Cut transport footprint'
      WHEN 2 THEN 'Lower home energy usage'
      ELSE 'Reduce food emissions'
    END,
    du.rn,
    gs.g
  ),
  CASE (gs.g % 3)
    WHEN 1 THEN 'transport'
    WHEN 2 THEN 'energy'
    ELSE 'food'
  END,
  CASE (gs.g % 3)
    WHEN 1 THEN 20
    WHEN 2 THEN 15
    ELSE 12
  END,
  CASE gs.g
    WHEN 1 THEN '8_days'
    WHEN 2 THEN '15_days'
    WHEN 3 THEN '30_days'
    WHEN 4 THEN '8_days'
    WHEN 5 THEN '15_days'
    WHEN 6 THEN '8_days'
    WHEN 7 THEN '30_days'
    WHEN 8 THEN '15_days'
    WHEN 9 THEN '30_days'
    WHEN 10 THEN '15_days'
  END,
  CASE (gs.g % 3)
    WHEN 1 THEN 'Use public transport or bike more often.'
    WHEN 2 THEN 'Switch off idle devices and improve appliance efficiency.'
    ELSE 'Prioritize lower-emission meals during the week.'
  END,
  p.baseline,
  t.tgt_kg,
  c.cur_kg,
  ROUND(p.baseline - t.tgt_kg, 2),
  ROUND(p.baseline - c.cur_kg, 2),
  pr.progress_pct::double precision,
  s.st,
  sd.start_d,
  ed.end_d,
  NOW() - ((du.rn + gs.g) || ' days')::interval
FROM demo_users du
CROSS JOIN goal_slots gs
CROSS JOIN LATERAL (
  SELECT
    ROUND((12::numeric + du.rn * 0.25 + gs.g * 0.1), 4) AS baseline,
    (CASE (gs.g % 3) WHEN 1 THEN 20 WHEN 2 THEN 15 ELSE 12 END) AS red_pct
) p
CROSS JOIN LATERAL (
  SELECT
    ROUND(p.baseline * p.red_pct / 100.0, 4) AS tgt_kg
) t
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN gs.g IN (4, 5, 9) THEN 'COMPLETED'
      WHEN gs.g IN (6, 7, 10) THEN 'EXPIRED'
      ELSE 'ACTIVE'
    END AS st
) s
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN s.st = 'COMPLETED' THEN t.tgt_kg
      WHEN s.st = 'EXPIRED' THEN ROUND(t.tgt_kg * (0.22 + ((du.rn + gs.g) % 5) * 0.09), 4)
      ELSE ROUND(t.tgt_kg * (0.36 + ((du.rn + gs.g) % 6) * 0.09), 4)
    END AS cur_kg
) c
CROSS JOIN LATERAL (
  SELECT
    LEAST(
      100.0,
      GREATEST(
        0.0,
        ROUND((c.cur_kg::numeric / NULLIF(t.tgt_kg, 0) * 100.0), 2)
      )
    )::numeric AS progress_pct
) pr
CROSS JOIN LATERAL (
  SELECT
    CASE gs.g
      WHEN 1 THEN (CURRENT_DATE - 2)
      WHEN 2 THEN (CURRENT_DATE - 5)
      WHEN 3 THEN (CURRENT_DATE - 10)
      WHEN 4 THEN (CURRENT_DATE - 30)
      WHEN 5 THEN (CURRENT_DATE - 40)
      WHEN 6 THEN (CURRENT_DATE - 20)
      WHEN 7 THEN (CURRENT_DATE - 50)
      WHEN 8 THEN (CURRENT_DATE - 1)
      WHEN 9 THEN (CURRENT_DATE - 60)
      WHEN 10 THEN (CURRENT_DATE - 25)
    END AS start_d
) sd
CROSS JOIN LATERAL (
  SELECT
    sd.start_d
      + (CASE
          WHEN gs.g IN (1, 4, 6) THEN 7
          WHEN gs.g IN (2, 5, 8, 10) THEN 14
          ELSE 29
        END) AS end_d
) ed;

COMMIT;
