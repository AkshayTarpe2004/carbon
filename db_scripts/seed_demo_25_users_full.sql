-- =============================================================================
-- seed_demo_25_users_full.sql (PostgreSQL, ASCII-safe)
-- =============================================================================
-- Creates 25 demo users and related data:
-- - surveys: 1 per user
-- - carbon_logs: 10 per user
-- - goals: 10 per user
-- - transactions: 10 per user
-- - badges: 2 per user
-- - notifications: 2 per user
-- - weekly_leaderboard: 1 row per user (current week)
--
-- Idempotent for demo users user1@gmail.com..user25@gmail.com.
-- =============================================================================

BEGIN;

-- Needed for bcrypt hashing in SQL (crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0) Demo marketplace items used by seeded transactions
INSERT INTO marketplace_items (
  item_name, item_type, price, description, carbon_offset_value,
  badge, impact_progress_percent, price_unit, header_icon, banner_key,
  created_at, updated_at, created_by, updated_by, ip_address
)
SELECT
  'Seed Tree Planting Pack',
  'Environmental',
  199.00,
  'Support verified tree planting initiatives.',
  18.00,
  'popular',
  68,
  'unit',
  'TREE',
  'environmental',
  NOW(), NOW(), 'seed_script', 'seed_script', '127.0.0.1'
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items WHERE item_name = 'Seed Tree Planting Pack'
);

INSERT INTO marketplace_items (
  item_name, item_type, price, description, carbon_offset_value,
  badge, impact_progress_percent, price_unit, header_icon, banner_key,
  created_at, updated_at, created_by, updated_by, ip_address
)
SELECT
  'Seed Solar Credit Bundle',
  'Renewable Energy',
  349.00,
  'Fund rooftop solar and renewable projects.',
  30.00,
  'new',
  51,
  'unit',
  'SUN',
  'renewable-energy',
  NOW(), NOW(), 'seed_script', 'seed_script', '127.0.0.1'
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items WHERE item_name = 'Seed Solar Credit Bundle'
);

INSERT INTO marketplace_items (
  item_name, item_type, price, description, carbon_offset_value,
  badge, impact_progress_percent, price_unit, header_icon, banner_key,
  created_at, updated_at, created_by, updated_by, ip_address
)
SELECT
  'Seed Community Cleanup Fund',
  'Sustainable Living',
  149.00,
  'Contribute to local cleanup and waste-reduction drives.',
  12.00,
  'limited',
  74,
  'unit',
  'RECYCLE',
  'sustainable-living',
  NOW(), NOW(), 'seed_script', 'seed_script', '127.0.0.1'
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items WHERE item_name = 'Seed Community Cleanup Fund'
);

-- 1) Upsert demo users
WITH seed_users AS (
  SELECT
    gs AS n,
    CASE gs
      WHEN 1 THEN 'Rahul Sharma'
      WHEN 2 THEN 'Neha Gupta'
      WHEN 3 THEN 'Aman Verma'
      WHEN 4 THEN 'Priya Singh'
      WHEN 5 THEN 'Arjun Patel'
      WHEN 6 THEN 'Sneha Iyer'
      WHEN 7 THEN 'Vikram Rao'
      WHEN 8 THEN 'Kavya Nair'
      WHEN 9 THEN 'Rohan Mehta'
      WHEN 10 THEN 'Ananya Das'
      WHEN 11 THEN 'Sanjay Kumar'
      WHEN 12 THEN 'Isha Kapoor'
      WHEN 13 THEN 'Manish Yadav'
      WHEN 14 THEN 'Pooja Sharma'
      WHEN 15 THEN 'Kiran Reddy'
      WHEN 16 THEN 'Divya Jain'
      WHEN 17 THEN 'Nikhil Joshi'
      WHEN 18 THEN 'Meera Menon'
      WHEN 19 THEN 'Siddharth Roy'
      WHEN 20 THEN 'Aarti Mishra'
      WHEN 21 THEN 'Harsh Vora'
      WHEN 22 THEN 'Ritika Saha'
      WHEN 23 THEN 'Gaurav Bhat'
      WHEN 24 THEN 'Tanvi Kulkarni'
      ELSE 'Yash Malhotra'
    END AS name,
    ('user' || gs::text || '@gmail.com') AS email
  FROM generate_series(1, 25) gs
)
INSERT INTO users (name, email, password, created_at, role, active)
SELECT
  su.name,
  su.email,
  crypt('password', gen_salt('bf', 10)),
  NOW() - ((26 - su.n) || ' days')::interval,
  'USER',
  TRUE
FROM seed_users su
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = 'USER',
    active = TRUE;

-- 2) Clear old seeded related rows for demo users
WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM notifications WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM transactions WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM badges WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM goals WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM carbon_logs WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM surveys WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM weekly_leaderboard WHERE user_id IN (SELECT id FROM demo_ids);

WITH demo_ids AS (
  SELECT id FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
DELETE FROM auth_tokens WHERE user_id IN (SELECT id FROM demo_ids);

-- 3) Surveys (1 per user)
WITH demo_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
INSERT INTO surveys (transport_mode, diet_type, energy_usage, frequency, created_at, user_id)
SELECT
  CASE (rn % 5)
    WHEN 1 THEN 'CAR'
    WHEN 2 THEN 'BIKE'
    WHEN 3 THEN 'PUBLIC'
    WHEN 4 THEN 'WALK'
    ELSE 'WFH'
  END,
  CASE WHEN (rn % 2) = 0 THEN 'VEG' ELSE 'NON_VEG' END,
  ROUND((5.5 + (rn * 0.35))::numeric, 2)::double precision,
  NULL,
  NOW() - ((rn % 20) || ' days')::interval,
  id
FROM demo_users;

-- 4) Carbon logs (10 per user)
WITH demo_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
),
days AS (
  SELECT generate_series(0, 9) AS d
)
INSERT INTO carbon_logs (
  user_id, date,
  transport_emission, food_emission, energy_emission, total_emission,
  transport_mode, distance_per_day, fuel_type,
  diet_type, meals_per_day, eating_out_frequency,
  monthly_electricity, renewable
)
SELECT
  du.id,
  CURRENT_DATE - d.d,
  ROUND((1.2 + (du.rn % 6) * 0.55 + d.d * 0.10)::numeric, 2),
  ROUND((2.0 + (du.rn % 5) * 0.45 + d.d * 0.08)::numeric, 2),
  ROUND((1.4 + (du.rn % 7) * 0.50 + d.d * 0.12)::numeric, 2),
  ROUND((
    (1.2 + (du.rn % 6) * 0.55 + d.d * 0.10) +
    (2.0 + (du.rn % 5) * 0.45 + d.d * 0.08) +
    (1.4 + (du.rn % 7) * 0.50 + d.d * 0.12)
  )::numeric, 2),
  CASE (du.rn % 5)
    WHEN 1 THEN 'CAR'
    WHEN 2 THEN 'BIKE'
    WHEN 3 THEN 'PUBLIC'
    WHEN 4 THEN 'WALK'
    ELSE 'WFH'
  END,
  ROUND((4 + (du.rn % 12) * 1.25)::numeric, 2)::double precision,
  CASE (du.rn % 4)
    WHEN 0 THEN 'PETROL'
    WHEN 1 THEN 'DIESEL'
    WHEN 2 THEN 'ELECTRIC'
    ELSE 'HYBRID'
  END,
  CASE WHEN (du.rn % 2) = 0 THEN 'VEG' ELSE 'NON_VEG' END,
  2 + (du.rn % 3),
  'WEEKLY',
  ROUND((5 + (du.rn % 10) * 0.6)::numeric, 2)::double precision,
  ((du.rn + d.d) % 2 = 0)
FROM demo_users du
CROSS JOIN days d;

-- 5) Goals (10 per user)
-- Timeframe values must be 8_days | 15_days | 30_days (see GoalService.inclusiveEndDateFromTimeframe).
-- COMPLETED: progress_percentage = 100, current_reduction_kg = target_reduction_kg.
-- EXPIRED: end_date < CURRENT_DATE, progress < 100, current_reduction < target.
-- ACTIVE: end_date >= CURRENT_DATE, status ACTIVE, progress < 100.
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

-- 6) Badges (2 per user)
WITH demo_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
INSERT INTO badges (user_id, badge_name, description, awarded_at)
SELECT
  du.id,
  CASE (du.rn % 5)
    WHEN 0 THEN 'First Log'
    WHEN 1 THEN 'Week Warrior'
    WHEN 2 THEN 'Low Emitter'
    WHEN 3 THEN 'Eco Streak'
    ELSE 'Survey Master'
  END,
  'Seeded achievement badge.',
  NOW() - ((du.rn % 12) || ' days')::interval
FROM demo_users du
UNION ALL
SELECT
  du.id,
  CASE (du.rn % 5)
    WHEN 0 THEN 'Goal Setter'
    WHEN 1 THEN 'Goal Achiever'
    WHEN 2 THEN 'Energy Saver'
    WHEN 3 THEN 'Community Leader'
    ELSE 'Green Champion'
  END,
  'Seeded achievement badge.',
  NOW() - ((du.rn % 8) || ' days')::interval
FROM demo_users du;

-- 7) Notifications (2 per user)
WITH demo_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
)
INSERT INTO notifications (
  created_at, is_read, message, title, type, user_id, admin_name, ip_address, updated_at, hidden_for_user
)
SELECT
  NOW() - ((du.rn % 10) || ' days')::interval,
  (du.rn % 3 = 0),
  'Great consistency this week - keep tracking your footprint.',
  'Weekly Progress',
  'goal',
  du.id,
  'System',
  '127.0.0.1',
  NOW(),
  FALSE
FROM demo_users du
UNION ALL
SELECT
  NOW() - ((du.rn % 6) || ' days')::interval,
  FALSE,
  'Your latest marketplace activity has been recorded successfully.',
  'Purchase Update',
  'purchase',
  du.id,
  'System',
  '127.0.0.1',
  NOW(),
  FALSE
FROM demo_users du;

-- 8) Transactions (10 per user)
WITH demo_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM users
  WHERE email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR email LIKE 'demo.user%@carboncalc.com'
),
seed_items AS (
  SELECT id, item_name
  FROM marketplace_items
  WHERE item_name IN (
    'Seed Tree Planting Pack',
    'Seed Solar Credit Bundle',
    'Seed Community Cleanup Fund'
  )
),
item1 AS (
  SELECT id FROM seed_items WHERE item_name = 'Seed Tree Planting Pack' LIMIT 1
),
item2 AS (
  SELECT id FROM seed_items WHERE item_name = 'Seed Solar Credit Bundle' LIMIT 1
),
item3 AS (
  SELECT id FROM seed_items WHERE item_name = 'Seed Community Cleanup Fund' LIMIT 1
),
tx_slots AS (
  SELECT generate_series(1, 10) AS t
)
INSERT INTO transactions (amount, carbon_offset, created_at, status, marketplace_item_id, user_id)
SELECT
  ROUND((129 + du.rn * 2.6 + tx.t * 4.1)::numeric, 2),
  ROUND((8 + du.rn * 0.45 + tx.t * 0.65)::numeric, 2),
  NOW() - (((du.rn + tx.t) % 20) || ' days')::interval,
  CASE
    WHEN tx.t % 8 = 0 THEN 'FAILED'
    WHEN tx.t % 5 = 0 THEN 'PENDING'
    ELSE 'SUCCESS'
  END,
  CASE
    WHEN (du.rn + tx.t) % 3 = 0 THEN (SELECT id FROM item3)
    WHEN (du.rn + tx.t) % 3 = 1 THEN (SELECT id FROM item1)
    ELSE (SELECT id FROM item2)
  END,
  du.id
FROM demo_users du
CROSS JOIN tx_slots tx;

-- 9) Weekly leaderboard (current week, one row per user)
WITH demo_users AS (
  SELECT
    u.id,
    u.name,
    ROW_NUMBER() OVER (ORDER BY u.email) AS rn
  FROM users u
  WHERE u.email ~ '^user([1-9]|1[0-9]|2[0-5])@gmail\\.com$'
     OR u.email LIKE 'demo.user%@carboncalc.com'
),
scores AS (
  SELECT du.*, (1500 - (du.rn - 1) * 32) AS score_val
  FROM demo_users du
),
ranked AS (
  SELECT
    s.*,
    ROW_NUMBER() OVER (ORDER BY s.score_val DESC, s.id ASC) AS rank_pos
  FROM scores s
)
INSERT INTO weekly_leaderboard (
  week_start, week_end, user_id, user_name, rank_position,
  marketplace_carbon_offset, goals_completed, badges_earned, score, created_at
)
SELECT
  date_trunc('week', CURRENT_DATE)::date,
  (date_trunc('week', CURRENT_DATE)::date + INTERVAL '6 day')::date,
  r.id,
  r.name,
  r.rank_pos,
  ROUND((8 + r.rn * 0.8)::numeric, 2)::double precision,
  1 + (r.rn % 4),
  1 + (r.rn % 5),
  r.score_val::double precision,
  NOW()
FROM ranked r;

COMMIT;
