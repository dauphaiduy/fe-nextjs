# NestJS Backend — Application Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
   - [Auth](#auth)
   - [Users](#users)
   - [Roles](#roles)
   - [Permissions](#permissions)
   - [Audit Log](#audit-log)
   - [Dashboard](#dashboard)
7. [Standard Response Format](#standard-response-format)
8. [Authentication & Authorization](#authentication--authorization)
9. [Global Providers](#global-providers)
10. [Data Layer — Queries & Repositories](#data-layer--queries--repositories)
11. [Running the Application](#running-the-application)
12. [Docker](#docker)

---

## Overview

A RESTful NestJS API providing:

- JWT-based authentication (login / register)
- Role-based access control (RBAC) with fine-grained permission strings
- Full user and role management
- Automatic audit logging for every request/response
- Dashboard analytics (summary counts, recent logs, user registration trend)
- Standardised API response envelope and global exception handling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript (`module: nodenext`) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Auth | JWT (`@nestjs/jwt`) |
| Validation | `class-validator` + `class-transformer` |
| Password hashing | `bcrypt` |
| Runtime | Node.js 22 |
| Container | Docker + Docker Compose |

---

## Project Structure

```
src/
├── main.ts                        Entry point — bootstraps app with ValidationPipe and global prefix
├── app.module.ts                  Root module — registers all feature modules and global providers
├── config/
│   └── config.ts                  Config factories: app, database, jwt
│
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts    @Public() — skip auth
│   │   ├── permission.decorator.ts @Permissions() — declare required permissions
│   │   └── current-user.decorator.ts @CurrentUser() — inject req.user
│   ├── filters/
│   │   └── all-exceptions.filter.ts  Global exception filter — unified error responses
│   ├── guard/
│   │   └── auth.guard.ts          Global auth + permission guard
│   ├── interceptors/
│   │   ├── transform.interceptor.ts   Wraps success responses in standard envelope
│   │   └── audit-log.interceptor.ts   Records every request/response to audit_logs table
│   ├── middlewares/
│   │   └── permission-val.middleware.ts  Attaches PermissionVal + AsyncLocalStorage context
│   ├── models/
│   │   └── permission-val.model.ts   Carries accessToken + permissions per request
│   ├── prisma/
│   │   └── prisma.service.ts      Extended PrismaClient with auto createdBy/updatedBy
│   ├── shared/
│   │   ├── queries/               Read-only DB access (find, findOne, count)
│   │   └── repositories/          Write DB access (create, update, delete)
│   ├── storage/
│   │   └── app.storage.ts         AsyncLocalStorage — per-request context propagation
│   └── utils/
│       └── hash.util.ts           hashPassword / comparePassword (bcrypt)
│
└── modules/
    ├── auth/          Login, Register
    ├── user/          User CRUD
    ├── roles/         Role CRUD
    ├── permissions/   In-memory permission registry
    ├── audit-log/     Audit log query endpoint
    └── dashboard/     Analytics endpoints
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values.

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP server port |
| `API_PREFIX` | `v1` | Global route prefix |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `nestjs` | Database name |
| `DATABASE_URL` | *(derived)* | Full Prisma connection string |
| `JWT_SECRET` | `secret` | JWT signing secret — **change in production** |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |

---

## Database Schema

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | Auto-increment |
| `email` | `String` unique | |
| `username` | `String?` unique | |
| `password` | `String?` | Null for OAuth accounts |
| `name` | `String?` | |
| `isActive` | `Boolean` | Default `false` |
| `accountType` | `AccountType` | `LOCAL` \| `GOOGLE` \| `GITHUB` |
| `roleId` | `Int` FK → `roles.id` | |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### `roles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | Auto-increment |
| `name` | `String` unique | |
| `permissions` | `Json?` | Array of permission strings, e.g. `["user:read","role:read"]`. Use `["*"]` for admin |
| `description` | `String?` | |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | Auto-increment |
| `userId` | `Int?` | Null for anonymous requests |
| `action` | `String` | HTTP method: GET, POST, PATCH, DELETE |
| `resource` | `String` | URL path without query string |
| `resourceId` | `String?` | ID segment extracted from URL |
| `statusCode` | `Int?` | HTTP response status |
| `ipAddress` | `String?` | Client IP (honours X-Forwarded-For) |
| `userAgent` | `String?` | |
| `metadata` | `Json?` | Sanitised request + response body |
| `createdAt` | `DateTime` | |

---

## API Reference

All routes are prefixed with `/v1` unless overridden by `API_PREFIX`.

Requests to protected endpoints must include:
```
Authorization: Bearer <accessToken>
```

---

### Auth

#### `POST /v1/auth/login` — Public

Login and receive a JWT.

**Request body:**
```json
{ "username": "alice", "password": "my-password" }
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { "accessToken": "eyJ..." },
  "timestamp": "2026-05-08T00:00:00.000Z"
}
```

**Errors:** `400` validation, `401` invalid credentials.

---

#### `POST /v1/auth/register` — Public

Register a new user.

**Request body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "my-password",
  "name": "Alice",
  "accountType": "LOCAL",
  "roleId": 1
}
```

**Response `200`:** Created user object.

**Errors:** `400` validation, `401` username/email already exists.

---

### Users

> Requires authentication.

#### `POST /v1/user` — `user:create`

Create a user.

**Request body:**
```json
{
  "email": "bob@example.com",
  "username": "bob",
  "password": "secret",
  "name": "Bob",
  "accountType": "LOCAL",
  "roleId": 1
}
```

---

#### `GET /v1/user` — `user:read`

List users with pagination and filters.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `email` | string | Case-insensitive partial match |
| `username` | string | Case-insensitive partial match |
| `name` | string | Case-insensitive partial match |
| `isActive` | boolean | Filter by active state |
| `accountType` | enum | `LOCAL` \| `GOOGLE` \| `GITHUB` |
| `roleId` | number | Filter by role |
| `page` | number | Default `1` |
| `limit` | number | Default `10` |

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [ { "id": 1, "email": "...", ... } ],
    "total": 42,
    "page": 1,
    "limit": 10
  },
  "timestamp": "..."
}
```

---

#### `PATCH /v1/user/:id` — `user:update`

Update a user by ID. All fields are optional.

---

### Roles

> Requires authentication.

#### `POST /v1/roles`

Create a role.

```json
{
  "name": "editor",
  "description": "Can read and update users",
  "permissions": ["user:read", "user:update"]
}
```

To create a superadmin role: `"permissions": ["*"]`

---

#### `GET /v1/roles`

List all roles.

---

#### `GET /v1/roles/:id`

Get a single role by ID.

---

#### `PATCH /v1/roles/:id`

Update a role.

---

#### `DELETE /v1/roles/:id`

Delete a role.

---

### Permissions

> Requires authentication.

#### `GET /v1/permissions`

Returns all permission strings registered in the system at startup.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user:create": "Create user",
    "user:read": "Read user",
    "user:update": "Update user",
    "user:delete": "Delete user",
    "role:create": "Create role",
    "role:read": "Read role",
    "role:update": "Update role",
    "role:delete": "Delete role",
    "audit-log:read": "Read audit log",
    "dashboard:read": "Read dashboard"
  },
  "timestamp": "..."
}
```

---

### Audit Log

> Requires `audit-log:read`.

#### `GET /v1/audit-log`

Query audit logs with filters and pagination.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `userId` | number | Filter by user |
| `action` | string | HTTP method (case-insensitive partial match) |
| `resource` | string | URL path (case-insensitive partial match) |
| `statusCode` | number | HTTP status code |
| `from` | ISO date | Start of date range (`createdAt >= from`) |
| `to` | ISO date | End of date range (`createdAt <= to`) |
| `page` | number | Default `1` |
| `limit` | number | Default `20` |

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [ { "id": 1, "action": "POST", "resource": "/v1/auth/login", ... } ],
    "total": 150,
    "page": 1,
    "limit": 20
  },
  "timestamp": "..."
}
```

---

### Dashboard

> Requires `dashboard:read`.

#### `GET /v1/dashboard/summary`

Returns top-level counts.

```json
{
  "data": {
    "totalUsers": 120,
    "activeUsers": 95,
    "inactiveUsers": 25,
    "totalRoles": 5,
    "totalAuditLogs": 3200
  }
}
```

---

#### `GET /v1/dashboard/recent-logs?limit=10`

Returns the most recent audit log entries.

---

#### `GET /v1/dashboard/user-trend?days=7`

Returns daily user registration counts for the past N days.

```json
{
  "data": [
    { "date": "2026-05-02", "count": 3 },
    { "date": "2026-05-03", "count": 7 },
    ...
  ]
}
```

---

## Standard Response Format

### Success

All successful responses are wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-05-08T10:00:00.000Z"
}
```

### Error

All errors are caught by `AllExceptionsFilter`:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email", "password must be a string"],
  "timestamp": "2026-05-08T10:00:00.000Z",
  "path": "/v1/user"
}
```

### Prisma error mapping

| Prisma code | HTTP status | Meaning |
|-------------|-------------|---------|
| `P2002` | `409 Conflict` | Unique constraint violation |
| `P2025` | `404 Not Found` | Record not found |
| `P2003` | `400 Bad Request` | Foreign key constraint failure |
| `P2014` | `400 Bad Request` | Relation violation |
| `PrismaClientValidationError` | `400 Bad Request` | Missing or invalid field |
| Unknown | `500 Internal Server Error` | Unexpected error |

---

## Authentication & Authorization

The flow on every request:

```
1. PermissionValMiddleware (runs first on all routes)
   └─ Attaches PermissionVal to req.permissionsVal
   └─ Stores request in AsyncLocalStorage

2. AuthGuard (global APP_GUARD)
   ├─ If @Public() → allow immediately
   ├─ Extract Bearer token from Authorization header
   ├─ Verify JWT → attach req.user = { sub, username, permissions[] }
   ├─ If no @Permissions() on route → authenticated user is allowed
   ├─ If user.permissions includes "*" → admin, allow all
   └─ Otherwise: user must have ALL permissions listed in @Permissions()

3. Route Handler
```

### JWT payload

```json
{
  "sub": 1,
  "username": "alice",
  "permissions": ["user:read", "role:read"]
}
```

Permissions are loaded from the user's role at login time and embedded in the token.

---

## Global Providers

Registered in `AppModule`:

| Token | Class | Scope |
|-------|-------|-------|
| `APP_FILTER` | `AllExceptionsFilter` | Catches all unhandled exceptions |
| `APP_GUARD` | `AuthGuard` | JWT verification + RBAC enforcement |
| `APP_INTERCEPTOR` | `TransformInterceptor` | Wraps successful responses |
| `APP_INTERCEPTOR` | `AuditLogInterceptor` | Persists every request to `audit_logs` |

`AuditLogInterceptor` automatically:
- Captures HTTP method, URL, user ID, IP, user agent
- Sanitises sensitive fields: `password`, `token`, `secret`, `accessToken` → `[REDACTED]`
- Records both the request payload and the response body
- Still logs on errors (captures the error status + message)

---

## Data Layer — Queries & Repositories

The codebase separates reads from writes:

| Class | Purpose |
|-------|---------|
| `UserQueries` | `find`, `findOne`, `count` |
| `UserRepository` | `create`, `update`, `delete` |
| `RoleQueries` | `find`, `findOne`, `findUnique`, `count` |
| `RoleRepository` | `create`, `update`, `delete` |
| `AuditLogQueries` | `find`, `count` |
| `AuditLogRepository` | `create` |

All classes extend `BaseQueries` / `BaseRepository` from `src/common/bases/`.

`PrismaService` extends `PrismaClient` and adds middleware that automatically sets `createdBy` / `updatedBy` fields (if present on the model) from the current request context via `AsyncLocalStorage`.

---

## Running the Application

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- Copy `.env.example` → `.env` and set values

### Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start in watch mode
npm run start:dev
```

### Production

```bash
npm run build
npx prisma migrate deploy
npm run start:prod
```

### Tests

```bash
npm test               # unit tests
npm run test:cov       # with coverage
npm run test:e2e       # end-to-end tests
```

---

## Docker

### docker compose (recommended)

```bash
# Start postgres + app
docker compose up --build -d

# View logs
docker compose logs -f app

# Stop
docker compose down
```

The `app` service will:
1. Wait for Postgres to pass its healthcheck
2. Run `prisma migrate deploy` on startup
3. Start the NestJS server on port 3000

### Build image only

```bash
docker build -t nestjs-app .
```

The [Dockerfile](../Dockerfile) uses a two-stage build:
- **Stage 1 (builder):** installs all deps → `prisma generate` → `npm run build`
- **Stage 2 (production):** installs prod-only deps, copies `dist/` + `prisma/` → runs on startup
