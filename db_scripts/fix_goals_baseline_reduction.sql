-- Baseline + reduction-based goal progress (align with application expectations)
-- Run against your app database (e.g. \c carbon_tracker)

-- Precision matches Goal.java (precision = 14, scale = 4)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS baseline_emission NUMERIC(14,4);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_reduction_kg NUMERIC(14,4);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_reduction_kg NUMERIC(14,4);
