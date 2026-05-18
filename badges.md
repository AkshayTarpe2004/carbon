# Badges

This document describes how **badge templates** are seeded and how **automatic awards** work in the CarbonCalc backend. Implementation lives in `BadgeService` (persist awards) and `BadgeRuleService` (when to award).

## Template catalog

Default rows are inserted on startup when `badge_templates` is empty (`DataInitializer` in the backend). Each template has a stable **`code`** used by rules and a **`name`** stored on the user’s earned `badges` row.

## When rules run

| Trigger | Service / flow |
|--------|-----------------|
| Carbon log created or updated for a day | `CarbonLogService` → `BadgeRuleService.afterCarbonLogSaved` |
| Goal created | `GoalService` → `afterGoalCreated` |
| Goal status becomes `COMPLETED` | `GoalService` → `afterGoalStatusUpdated` |
| Lifestyle survey submitted | `SurveyService` → `afterSurveySubmitted` |
| Global leaderboard computed | `LeaderboardService` → `onLeaderboardPosition` (per non-admin user) |
| Marketplace purchase **SUCCESS** (immediate or after pending settlement) | `TransactionService` → `afterCarbonOffsetTotalMayHaveChanged` |

Awards are **idempotent**: `BadgeService.awardBadge` rejects duplicate `(user, badgeName)`; rules use `safeAward`, which ignores failures (including “already awarded”).

## Automatic awards (by template `code`)

Emissions are read from **`carbon_logs`** (daily). If more than one log exists for the same calendar day, the **latest row by id** is used for that day’s totals.

| Code | Display name (seed) | Automatic condition |
|------|---------------------|------------------------|
| `FIRST_LOG` | First Log | User has exactly **one** carbon log. |
| `WEEK_WARRIOR` | Week Warrior | Longest run of **consecutive calendar days** with at least one log is **≥ 7**. |
| `LOW_EMITTER` | Low Emitter | **≥ 5** distinct days where **total** emissions for the day are **&lt; 10** kg CO₂e. |
| `ECO_STREAK` | Eco Streak | **≥ 14** consecutive days where each day’s **total** is **&lt; 10** kg CO₂e. |
| `PLANT_BASED_HERO` | Plant-Based Hero | **≥ 14** consecutive days where each day’s **food** emissions are **&lt; 5** kg CO₂e. |
| `ENERGY_SAVER` | Energy Saver | **≥ 30** consecutive days where each day’s **energy** emissions are **&lt; 8** kg CO₂e. |
| `SOLAR_HERO` | Solar Hero | **≥ 7** consecutive days where **energy** emissions are effectively **0** (absolute value **&lt; 0.05** kg). |
| `PUBLIC_TRANSPORT_PRO` | Public Transport Pro | In the **last 30** calendar days (including today): at least **5** logs, and **≥ 70%** of those logs have `transport_mode` = **`PUBLIC`** (case-insensitive). |
| `WEEKLY_CHECKIN` | Weekly Check-in | Logs appear in **8** different **Monday-aligned week buckets** (ISO-style week start Monday) that form a chain of **8 consecutive weeks** with at least one log each week. |
| `CARBON_CUTTER` | Carbon Cutter | Sum of **total** emissions in the last **30** days is at least **20%** lower than the sum in the **previous 30** days (previous window must be **&gt; 0**). |
| `CARBON_SAVER` | Carbon Saver | Same numerical rule as **Carbon Cutter** (both can unlock together). |
| `CONSISTENCY_KING` | Consistency King | User has **≥ 100** carbon logs (all days). |
| `GOAL_SETTER` | Goal Setter | User has at least **one** goal and total goal count reached **1** on create (first goal). |
| `GOAL_ACHIEVER` | Goal Achiever | At least **one** goal with status **COMPLETED** after an update to completed. |
| `GREEN_ACHIEVER` | Green Achiever | Same as **Goal Achiever** (first completion path). |
| `ECO_STARTER` | Eco Starter | User’s **first** saved survey (`count == 1` after save). |
| `SURVEY_MASTER` | Survey Master | User has **≥ 1** survey submitted. |
| `NIGHT_LOGGER` | Night Logger | **≥ 5** surveys with `created_at` hour **22–23** or **0–4** (server local time). Uses survey timestamps; carbon logs do not store time-of-day. |
| `GREEN_CHAMPION` | Green Champion | When the global leaderboard is built: user’s **rank** is within the top **ceil(10% × N)** of **N** non-admin users (same score ordering as leaderboard). |
| `TREE_PLANTER` | Tree Planter | Sum of **`carbon_offset`** on marketplace transactions with status **`SUCCESS`** for the user is **≥ 100** (same units as stored offsets). |

## Manual awards

Admins can still grant badges via the admin API (`POST /api/badges/award/{userId}`). Those names must match an existing template **name** if you want them to show correctly on **My Badges** (merged with templates in the frontend).

## API reference (user)

- `GET /api/badge-templates` — catalog (respect `active` flag on the UI).
- `GET /api/badges` — earned badges for the logged-in user.

## Frontend

- **My Badges**: `frontend/src/pages/Badges.js` merges templates with earned rows, dedupes by normalized name, and sorts earned first.

## Changing thresholds

Constants such as `10`, `8`, `5`, `100`, and `0.20` (20% reduction) are defined in `BadgeRuleService.java`. Adjust there and keep this file in sync if you change product rules.
