# Database Backup

This folder contains exports of the current PostgreSQL database used by the
CarbonTracker backend.

## Current Backup

- Full schema and data dump: `carbon_tracker_20260426_203913.dump`
- Schema-only SQL export: `carbon_tracker_schema_20260426_203913.sql`

The full backup was created from:

- Host: `localhost`
- Port: `5432`
- Database: `carbon_tracker`
- User: `postgres`
- PostgreSQL dump format: custom archive

## Restore Full Backup

Create a new empty database:

```powershell
createdb -U postgres carbon_tracker
```

Restore the backup:

```powershell
pg_restore -U postgres -d carbon_tracker "db_scripts\backups\carbon_tracker_20260426_203913.dump"
```

If the database already exists and you want to replace its objects, use:

```powershell
pg_restore -U postgres --clean --if-exists -d carbon_tracker_restore "db_scripts\backups\carbon_tracker_20260426_203913.dump"
```

## Restore Schema Only

Use this when you only want the table structure without data:

```powershell
psql -U postgres -d carbon_tracker_restore -f "db_scripts\backups\carbon_tracker_schema_20260426_203913.sql"
```

## Create A New Backup

From the project root:

```powershell
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$env:PGPASSWORD = "your_database_password"
pg_dump -h localhost -p 5432 -U postgres -d carbon_tracker -F c -b -f "db_scripts\backups\carbon_tracker_$ts.dump"
pg_dump -h localhost -p 5432 -U postgres -d carbon_tracker --schema-only -f "db_scripts\backups\carbon_tracker_schema_$ts.sql"
Remove-Item Env:\PGPASSWORD
```

## Notes

- Do not commit database dumps if they contain real user data or private data.
- Keep `backend/.env` private because it contains credentials and application secrets.
- The backend database connection is configured through `DATASOURCE_URL`,
  `DATASOURCE_USER`, and `DATABASE_PASSWORD`.
