-- =============================================================================
-- seed_one_user_2_months_full.sql (PostgreSQL, ASCII-safe)
-- =============================================================================
-- Creates one demo user with two months of dummy data across the main app tables:
-- - users: 1 user
-- - surveys: 8 survey submissions
-- - carbon_logs: 60 daily logs
-- - goals: 6 goals
-- - badges: 12 badges
-- - notifications: 8 notifications
-- - transactions: 12 marketplace transactions
-- - weekly_leaderboard: 9 weekly rows
--
-- Demo login:
--   Email:    s22_tarpe_akshay@mgmcen.ac.in
--   Password: Akshay@12
--
-- Run:
--   psql -U postgres -d carbon_tracker -f db_scripts/seed_one_user_2_months_full.sql
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Demo marketplace items used by seeded transactions.
INSERT INTO marketplace_items (
  item_name, item_type, price, description, carbon_offset_value,
  badge, impact_progress_percent, price_unit, header_icon, banner_key,
  created_at, updated_at, created_by, updated_by, ip_address
)
SELECT
  'Two Month Tree Planting Pack',
  'Environmental',
  199.00,
  'Support verified tree planting initiatives.',
  18.00,
  'popular',
  68,
  'unit',
  'TREE',
  'environmental',
  NOW(), NOW(), 'seed_one_user_2_months', 'seed_one_user_2_months', '127.0.0.1'
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items WHERE item_name = 'Two Month Tree Planting Pack'
);

INSERT INTO marketplace_items (
  item_name, item_type, price, description, carbon_offset_value,
  badge, impact_progress_percent, price_unit, header_icon, banner_key,
  created_at, updated_at, created_by, updated_by, ip_address
)
SELECT
  'Two Month Solar Credit Bundle',
  'Renewable Energy',
  349.00,
  'Fund rooftop solar and renewable projects.',
  30.00,
  'new',
  51,
  'unit',
  'SUN',
  'renewable-energy',
  NOW(), NOW(), 'seed_one_user_2_months', 'seed_one_user_2_months', '127.0.0.1'
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items WHERE item_name = 'Two Month Solar Credit Bundle'
);

INSERT INTO marketplace_items (
  item_name, item_type, price, description, carbon_offset_value,
  badge, impact_progress_percent, price_unit, header_icon, banner_key,
  created_at, updated_at, created_by, updated_by, ip_address
)
SELECT
  'Two Month Community Cleanup Fund',
  'Sustainable Living',
  149.00,
  'Contribute to local cleanup and waste-reduction drives.',
  12.00,
  'limited',
  74,
  'unit',
  'RECYCLE',
  'sustainable-living',
  NOW(), NOW(), 'seed_one_user_2_months', 'seed_one_user_2_months', '127.0.0.1'
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items WHERE item_name = 'Two Month Community Cleanup Fund'
);

-- Upsert the demo user.
INSERT INTO users (name, email, password, created_at, role, active)
VALUES (
  'Akshay Tarpe',
  's22_tarpe_akshay@mgmcen.ac.in',
  crypt('Akshay@12', gen_salt('bf', 10)),
  CURRENT_TIMESTAMP - INTERVAL '60 days',
  'USER',
  TRUE
)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = 'USER',
    active = TRUE;

-- Clear old seeded data for this one user so the script is repeatable.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM notifications WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM transactions WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM badges WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM goals WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM carbon_logs WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM surveys WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM weekly_leaderboard WHERE user_id IN (SELECT id FROM demo_user);

WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
)
DELETE FROM auth_tokens WHERE user_id IN (SELECT id FROM demo_user);

-- 1) Carbon logs: one daily log for the last 60 days.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
days AS (
  SELECT
    gs::date AS log_date,
    ROW_NUMBER() OVER (ORDER BY gs::date) AS day_no
  FROM generate_series(
    CURRENT_DATE - INTERVAL '59 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) gs
),
answers AS (
  SELECT
    du.id AS user_id,
    d.log_date,
    d.day_no,
    CASE
      WHEN EXTRACT(DOW FROM d.log_date) IN (0, 6) THEN 'WALK'
      WHEN d.day_no % 5 = 0 THEN 'PUBLIC'
      WHEN d.day_no % 4 = 0 THEN 'BIKE'
      ELSE 'CAR'
    END AS transport_mode,
    CASE d.day_no % 4
      WHEN 0 THEN 'PETROL'
      WHEN 1 THEN 'DIESEL'
      WHEN 2 THEN 'ELECTRIC'
      ELSE 'HYBRID'
    END AS fuel_type,
    CASE WHEN d.day_no % 3 = 0 THEN 'VEG' ELSE 'NON_VEG' END AS diet_type,
    CASE WHEN d.day_no % 6 = 0 THEN 2 ELSE 3 END AS meals_per_day,
    CASE
      WHEN d.day_no % 10 = 0 THEN 'OFTEN'
      WHEN d.day_no % 4 = 0 THEN 'WEEKLY'
      ELSE 'RARELY'
    END AS eating_out_frequency,
    CASE WHEN d.day_no % 9 = 0 THEN TRUE ELSE FALSE END AS renewable,
    CASE
      WHEN EXTRACT(DOW FROM d.log_date) IN (0, 6) THEN 1.5
      WHEN d.day_no % 5 = 0 THEN 14.0
      WHEN d.day_no % 4 = 0 THEN 6.0
      ELSE 10.0 + (d.day_no % 7)
    END AS distance_per_day,
    6.0 + ((d.day_no % 8) * 0.35) AS daily_electricity
  FROM demo_user du
  CROSS JOIN days d
),
calculated AS (
  SELECT
    a.*,
    CASE
      WHEN a.transport_mode = 'CAR' AND a.fuel_type = 'PETROL' THEN a.distance_per_day * 0.21
      WHEN a.transport_mode = 'CAR' AND a.fuel_type = 'DIESEL' THEN a.distance_per_day * 0.18
      WHEN a.transport_mode = 'CAR' AND a.fuel_type = 'ELECTRIC' THEN a.distance_per_day * 0.05
      WHEN a.transport_mode = 'CAR' THEN a.distance_per_day * 0.15
      WHEN a.transport_mode = 'PUBLIC' THEN a.distance_per_day * 0.12
      WHEN a.transport_mode = 'BIKE' THEN a.distance_per_day * 0.024
      ELSE 0
    END AS transport_emission_raw,
    CASE
      WHEN a.diet_type = 'VEG' THEN 1.5 * a.meals_per_day
      ELSE 3.3 * a.meals_per_day
    END AS food_emission_raw,
    (a.daily_electricity * 0.82 * CASE WHEN a.renewable THEN 0.6 ELSE 1 END) AS energy_emission_raw
  FROM answers a
)
INSERT INTO carbon_logs (
  user_id, date,
  transport_emission, food_emission, energy_emission, total_emission,
  transport_mode, distance_per_day, fuel_type,
  diet_type, meals_per_day, eating_out_frequency,
  monthly_electricity, renewable
)
SELECT
  user_id,
  log_date,
  ROUND(transport_emission_raw::numeric, 2),
  ROUND(food_emission_raw::numeric, 2),
  ROUND(energy_emission_raw::numeric, 2),
  ROUND((transport_emission_raw + food_emission_raw + energy_emission_raw)::numeric, 2),
  transport_mode,
  ROUND(distance_per_day::numeric, 2)::double precision,
  CASE WHEN transport_mode = 'CAR' THEN fuel_type ELSE NULL END,
  diet_type,
  meals_per_day,
  eating_out_frequency,
  ROUND(daily_electricity::numeric, 2)::double precision,
  renewable
FROM calculated;

-- 2) Surveys: eight submissions across the same two-month period.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
survey_slots AS (
  SELECT generate_series(0, 7) AS slot_no
)
INSERT INTO surveys (transport_mode, diet_type, energy_usage, frequency, created_at, user_id)
SELECT
  CASE slot_no % 4
    WHEN 0 THEN 'CAR'
    WHEN 1 THEN 'PUBLIC'
    WHEN 2 THEN 'BIKE'
    ELSE 'WALK'
  END,
  CASE WHEN slot_no % 2 = 0 THEN 'NON_VEG' ELSE 'VEG' END,
  ROUND((6.4 + slot_no * 0.25)::numeric, 2)::double precision,
  CASE
    WHEN slot_no % 3 = 0 THEN 'WEEKLY'
    WHEN slot_no % 3 = 1 THEN 'RARELY'
    ELSE 'OFTEN'
  END,
  CURRENT_TIMESTAMP - ((56 - slot_no * 8) || ' days')::interval,
  du.id
FROM demo_user du
CROSS JOIN survey_slots;

-- 3) Goals: active, completed, and expired examples.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
goal_data AS (
  SELECT *
  FROM (
    VALUES
      ('Cut weekday car travel', 'transport', 20, '30_days', 'Use public transport or bike for short trips.', 18.50, 3.70, 1.85, 'ACTIVE', CURRENT_DATE - 12, CURRENT_DATE + 17),
      ('Lower home electricity', 'energy', 15, '15_days', 'Switch off idle devices and use efficient appliances.', 16.25, 2.44, 2.44, 'COMPLETED', CURRENT_DATE - 40, CURRENT_DATE - 26),
      ('Reduce high-emission meals', 'food', 12, '30_days', 'Choose more vegetarian meals each week.', 20.00, 2.40, 0.96, 'ACTIVE', CURRENT_DATE - 5, CURRENT_DATE + 24),
      ('Weekend low travel plan', 'transport', 10, '8_days', 'Walk for nearby weekend errands.', 12.75, 1.28, 1.28, 'COMPLETED', CURRENT_DATE - 30, CURRENT_DATE - 23),
      ('Green energy trial', 'energy', 18, '15_days', 'Use renewable or green tariff when possible.', 14.80, 2.66, 0.80, 'EXPIRED', CURRENT_DATE - 35, CURRENT_DATE - 21),
      ('Sustainable food week', 'food', 10, '8_days', 'Reduce eating out and add lower-carbon meals.', 19.20, 1.92, 0.58, 'EXPIRED', CURRENT_DATE - 20, CURRENT_DATE - 13)
  ) AS g(goal_title, category, reduction_target, timeframe, description, baseline_emission,
         target_reduction_kg, current_reduction_kg, status, start_date, end_date)
)
INSERT INTO goals (
  user_id, goal_title, category, reduction_target, timeframe, description,
  baseline_emission, target_reduction_kg, current_reduction_kg,
  target_emission, current_emission, progress_percentage, status,
  start_date, end_date, created_at
)
SELECT
  du.id,
  g.goal_title,
  g.category,
  g.reduction_target,
  g.timeframe,
  g.description,
  g.baseline_emission,
  g.target_reduction_kg,
  g.current_reduction_kg,
  ROUND((g.baseline_emission - g.target_reduction_kg)::numeric, 2),
  ROUND((g.baseline_emission - g.current_reduction_kg)::numeric, 2),
  LEAST(100.0, ROUND((g.current_reduction_kg / NULLIF(g.target_reduction_kg, 0) * 100.0)::numeric, 2))::double precision,
  g.status,
  g.start_date,
  g.end_date,
  g.start_date::timestamp
FROM demo_user du
CROSS JOIN goal_data g;

-- 4) Badges.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
badge_data AS (
  SELECT *
  FROM (
    VALUES
      ('First Log', 'Logged your very first carbon entry.', 58),
      ('Week Warrior', 'Logged carbon data for 7 consecutive days.', 50),
      ('Low Emitter', 'Kept daily emissions under 10 kg CO2e for multiple days.', 47),
      ('Survey Master', 'Completed the lifestyle survey.', 42),
      ('Eco Starter', 'Completed your very first lifestyle survey.', 41),
      ('Goal Setter', 'Created your first sustainability goal.', 39),
      ('Goal Achiever', 'Completed at least one sustainability goal.', 26),
      ('Green Achiever', 'Completed your first sustainability goal.', 25),
      ('Energy Saver', 'Kept household energy usage efficient.', 12),
      ('Weekly Check-in', 'Tracked emissions once a week for 8 consecutive weeks.', 9),
      ('Tree Planter', 'Offset 100 kg CO2e through successful marketplace purchases.', 6),
      ('Green Champion', 'Reached a top leaderboard position.', 3)
  ) AS b(badge_name, description, days_ago)
)
INSERT INTO badges (user_id, badge_name, description, awarded_at)
SELECT
  du.id,
  b.badge_name,
  b.description,
  CURRENT_TIMESTAMP - (b.days_ago || ' days')::interval
FROM demo_user du
CROSS JOIN badge_data b;

-- 5) Notifications.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
notification_data AS (
  SELECT *
  FROM (
    VALUES
      ('Welcome to CarbonCalc', 'Your demo account is ready with two months of history.', 'info', TRUE, 59),
      ('Weekly Progress', 'Your transport emissions improved this week.', 'goal', TRUE, 48),
      ('Goal Completed', 'You completed the Lower home electricity goal.', 'goal', FALSE, 26),
      ('Badge Earned', 'You earned the Goal Achiever badge.', 'badge', FALSE, 25),
      ('Purchase Update', 'Your tree planting offset purchase was successful.', 'purchase', TRUE, 18),
      ('High Emission Alert', 'Food emissions were higher than usual on some days.', 'alert', FALSE, 12),
      ('Weekly Progress', 'Great consistency this week - keep tracking your footprint.', 'goal', FALSE, 5),
      ('Marketplace Reminder', 'Explore offsets to balance your latest footprint.', 'purchase', FALSE, 2)
  ) AS n(title, message, type, is_read, days_ago)
)
INSERT INTO notifications (
  created_at, is_read, message, title, type, user_id,
  admin_name, ip_address, updated_at, hidden_for_user
)
SELECT
  CURRENT_TIMESTAMP - (n.days_ago || ' days')::interval,
  n.is_read,
  n.message,
  n.title,
  n.type,
  du.id,
  'System',
  '127.0.0.1',
  CURRENT_TIMESTAMP - (n.days_ago || ' days')::interval,
  FALSE
FROM demo_user du
CROSS JOIN notification_data n;

-- 6) Transactions.
WITH demo_user AS (
  SELECT id FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
seed_items AS (
  SELECT id, item_name
  FROM marketplace_items
  WHERE item_name IN (
    'Two Month Tree Planting Pack',
    'Two Month Solar Credit Bundle',
    'Two Month Community Cleanup Fund'
  )
),
tx_slots AS (
  SELECT generate_series(1, 12) AS tx_no
)
INSERT INTO transactions (amount, carbon_offset, created_at, status, marketplace_item_id, user_id)
SELECT
  CASE tx.tx_no % 3
    WHEN 0 THEN 149.00
    WHEN 1 THEN 199.00
    ELSE 349.00
  END,
  CASE tx.tx_no % 3
    WHEN 0 THEN 12.00
    WHEN 1 THEN 18.00
    ELSE 30.00
  END,
  CURRENT_TIMESTAMP - ((60 - tx.tx_no * 5) || ' days')::interval,
  CASE
    WHEN tx.tx_no IN (5, 11) THEN 'PENDING'
    WHEN tx.tx_no = 8 THEN 'FAILED'
    ELSE 'SUCCESS'
  END,
  CASE tx.tx_no % 3
    WHEN 0 THEN (SELECT id FROM seed_items WHERE item_name = 'Two Month Community Cleanup Fund' LIMIT 1)
    WHEN 1 THEN (SELECT id FROM seed_items WHERE item_name = 'Two Month Tree Planting Pack' LIMIT 1)
    ELSE (SELECT id FROM seed_items WHERE item_name = 'Two Month Solar Credit Bundle' LIMIT 1)
  END,
  du.id
FROM demo_user du
CROSS JOIN tx_slots tx;

-- 7) Weekly leaderboard rows covering the two-month period.
WITH demo_user AS (
  SELECT id, name FROM users WHERE email = 's22_tarpe_akshay@mgmcen.ac.in'
),
weeks AS (
  SELECT generate_series(0, 8) AS week_no
)
INSERT INTO weekly_leaderboard (
  week_start, week_end, user_id, user_name, rank_position,
  marketplace_carbon_offset, goals_completed, badges_earned, score, created_at
)
SELECT
  (date_trunc('week', CURRENT_DATE)::date - (w.week_no * 7))::date,
  (date_trunc('week', CURRENT_DATE)::date - (w.week_no * 7) + INTERVAL '6 days')::date,
  du.id,
  du.name,
  1 + (w.week_no % 5),
  (18 + w.week_no * 2.5)::double precision,
  CASE WHEN w.week_no IN (2, 5) THEN 2 ELSE 1 END,
  1 + (w.week_no % 3),
  (1420 - w.week_no * 24)::double precision,
  CURRENT_TIMESTAMP - (w.week_no * INTERVAL '7 days')
FROM demo_user du
CROSS JOIN weeks w;

COMMIT;
