# CarbonCalc - Backend

## Overview

Spring Boot (Java 17) backend for the Personal Carbon Footprint application.

It handles:
- JWT and OAuth2 authentication (Google/GitHub)
- User management and admin controls
- Carbon logs, goals, badges, and analytics
- Marketplace items and user transactions
- User/admin notifications
- Live leaderboard and weekly leaderboard snapshots
- Admin settings (including maintenance mode)

Frontend app path: `../frontend`  
Default backend URL: `http://localhost:8080`

---

## Tech stack

- Java 17
- Spring Boot 3
- Spring Security (JWT + OAuth2)
- Spring Data JPA / Hibernate
- PostgreSQL
- Maven

---

## Prerequisites

- JDK 17+
- Maven 3.8+
- PostgreSQL

Default local DB:
- Database: `carbon_tracker`
- Username: `postgres`
- Password: `root`

---

## Configuration

Check:
- `src/main/resources/application.properties`
- `src/main/resources/application-local.properties`

Important properties:
- `spring.datasource.url=jdbc:postgresql://localhost:5432/carbon_tracker`
- `spring.datasource.username=postgres`
- `spring.datasource.password=root`
- `spring.jpa.hibernate.ddl-auto=update`
- `app.oauth2.authorizedRedirectUri=http://localhost:3000/oauth2/redirect`

---

## Setup and Run

From `backend/`:

```bash
mvn spring-boot:run
```

### Build

```bash
mvn clean package
java -jar target/carbontracker-0.0.1-SNAPSHOT.jar
```

## Key APIs

### Auth and settings
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

Maintenance mode behavior:
- Non-admin password login is blocked when maintenance is enabled.
- Non-admin OAuth login is also blocked.
- Admin login remains allowed.

### Users
- `GET /api/users`
- `PUT /api/users/{id}/block`
- `PUT /api/users/{id}/unblock`
- `DELETE /api/users/{id}`

### Carbon logs and goals
- `GET /api/carbon/logs`
- `GET /api/carbon/logs/admin/all`
- `POST /api/goals`
- `GET /api/goals`
- `GET /api/goals/admin`

### Badges
- `GET /api/badge-templates`
- `POST /api/badge-templates`
- `PUT /api/badge-templates/{id}`
- `GET /api/badges`
- `POST /api/badges/award/{userId}`
- `GET /api/badges/admin/stats`

### Marketplace and transactions
- `GET /api/marketplace/items`
- `POST /api/marketplace/items`
- `PUT /api/marketplace/items/{id}`
- `DELETE /api/marketplace/items/{id}`
- `POST /api/transactions`
- `GET /api/transactions/user/{userId}`
- `GET /api/transactions`

### Notifications
- `GET /api/notifications`
- `GET /api/notifications/user/{userId}`
- `POST /api/notifications`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/{id}/hide`

### Leaderboard
- `GET /api/leaderboard` (live)
- `GET /api/leaderboard/weekly?weekStart=YYYY-MM-DD`
- `GET /api/leaderboard/weekly/weeks`

Live leaderboard scoring uses emission reduction, completed goals, and earned badges.
Weekly snapshots are stored in `weekly_leaderboard`.

---

## Schema and data notes

- Hibernate updates schema at startup (`ddl-auto=update`).
- Reference SQL is maintained in `../db_scripts/schema.sql`.
- Weekly leaderboard snapshots are persisted for historical views.

---

## Test

```bash
mvn test
```

