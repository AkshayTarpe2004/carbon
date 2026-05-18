# CarbonCalc - Frontend

## Overview

React frontend for the Personal Carbon Footprint application.

Users can track emissions, manage goals, browse marketplace items, buy offsets, view notifications, and check leaderboard rankings.  
Admins can manage the full system from the Admin Dashboard.

---

## Setup and Run

### 1) Start backend

From `backend/`:

```bash
mvn spring-boot:run
```

### 2) Start frontend

From `frontend/`:

```bash
npm install
npm start
```

Frontend: `http://localhost:3000`  
Backend default: `http://localhost:8080`

---

## Configuration

Uses:
- `REACT_APP_API_URL` (default `http://localhost:8080`)

Example `.env`:

```bash
REACT_APP_API_URL=http://localhost:8080
```

Restart frontend after updating env values.

---

## Features

### Authentication
- OAuth2 login (Google/GitHub) and normal login
- JWT token handling in `localStorage`
- Maintenance mode handling for non-admin users (shows maintenance message and blocks access)

### User pages
- Dashboard with real carbon data and trend views
- Carbon history and editable logs
- Goals with live progress percentage display
- Badges with earned/locked states
- Marketplace with real API data and purchase flow
- Transactions with sorting and normalized item data
- Notifications with user-side dismiss (soft hide)
- Leaderboard filter: `Live` and `Last week`

### Admin dashboard
- Analytics cards with real data (including badges and transaction totals)
- User management (block/unblock/delete)
- Goals and carbon data monitoring
- Badge templates and badge awarding
- Marketplace item management
- Notification management (targeted and broadcast)
- Transactions monitoring
- Admin audit logs with action filter
- Settings: maintenance mode control

---

## API Integration

Frontend integrates with:
- `/api/auth/*`
- `/api/admin/settings`
- `/api/carbon/logs`, `/api/carbon/logs/admin/all`
- `/api/goals`, `/api/goals/admin`
- `/api/badges`, `/api/badges/admin/stats`, `/api/badge-templates`
- `/api/marketplace/items`
- `/api/transactions`, `/api/transactions/user/{userId}`
- `/api/notifications`, `/api/notifications/user/{userId}`, `/api/notifications/{id}/hide`
- `/api/leaderboard`, `/api/leaderboard/weekly`

---

## Notes

- The old marketing Contact nav link was removed.
- Support email links are available on landing/about pages.
- Admin and user leaderboards now share the same simple filter experience (`Live` / `Last week`).

For backend and DB setup, see:
- `../backend/README.md`
- `../db_scripts/README.md`

