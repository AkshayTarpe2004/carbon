# CarbonTracker - Database

## Overview

PostgreSQL schema notes for the CarbonCalc backend.

---

## Setup

### Create database

```sql
CREATE DATABASE carbon_tracker;
```

---

### Default local connection

Configured in backend properties:
- URL: `jdbc:postgresql://localhost:5432/carbon_tracker`
- Username: `postgres`
- Password: `root`

---

## Schema

- Main reference file: `schema.sql`
- Runtime schema is managed by Hibernate (`spring.jpa.hibernate.ddl-auto=update`)
- Demo seed file: `seed_demo_25_users_full.sql` (adds ~25 users with surveys/logs/goals/transactions/etc.; users are `user1@gmail.com` ... `user25@gmail.com`)
- Single-user two-month seed file: `seed_one_user_2_months_full.sql` (adds one user with 60 days of logs plus surveys/goals/badges/transactions/notifications/leaderboard rows; login is `s22_tarpe_akshay@mgmcen.ac.in` / `Akshay@12`)

If you are creating a fresh DB manually, run `schema.sql` first, then start backend.
If you want sample data for testing UI flows, run `seed_demo_25_users_full.sql`.
If you want focused two-month history for one user, run `seed_one_user_2_months_full.sql`.

**Goals in demo data:** timeframes are stored as `8_days` / `15_days` / `30_days` (same as the Goals UI and `GoalService`). `COMPLETED` goals have 100% progress; `EXPIRED` has `end_date` before today and progress under 100%. If you already ran an older seed, use `patch_demo_goals_coherence.sql` to delete and reinsert goals for demo users with the same rules (no need to re-seed the whole database).

---

## Tables

The schema currently includes:

1. `users`
2. `auth_tokens`
3. `badge_templates`
4. `badges`
5. `carbon_logs`
6. `goals`
7. `marketplace`
8. `marketplace_items`
9. `notifications`
10. `surveys`
11. `transactions`
12. `admin_audit_logs`
13. `weekly_leaderboard`

---

## Notes

- Added missing tables to match current project DB:  
  `admin_audit_logs`, `marketplace`, `marketplace_items`, `notifications`, `transactions`.
- Aligned table definitions with live PostgreSQL metadata for those newly added tables.
- `weekly_leaderboard` is used to persist weekly leaderboard snapshots for `Last week` views.
- Current survey flow now uses `VEG`/`NON_VEG` diet options; migration script normalizes legacy `VEGAN` rows to `VEG`.
