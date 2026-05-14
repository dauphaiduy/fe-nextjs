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
   - [Categories](#categories)
   - [Products](#products)
   - [Customer Profile](#customer-profile)
7. [Standard Response Format](#standard-response-format)
8. [Authentication & Authorization](#authentication--authorization)
9. [Global Providers](#global-providers)
10. [Data Layer — Queries & Repositories](#data-layer--queries--repositories)
11. [Running the Application](#running-the-application)
12. [Docker](#docker)

---

## Overview

A RESTful NestJS API providing:

- JWT-based authentication — separate login flows for admin panel and shop
- Role-based access control (RBAC) with fine-grained permission strings (admin/staff only)
- User type system: `ADMIN`, `STAFF`, `CUSTOMER`
- Full user and role management
- Customer profile management (customers update their own profile after registration)
- Automatic audit logging for every request/response
- Dashboard analytics (summary counts, recent logs, user registration trend)
- Product catalogue management with category organisation — public read access
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
    ├── auth/               Login (shop + admin), Register
    ├── user/               User CRUD
    ├── roles/              Role CRUD
    ├── permissions/        In-memory permission registry
    ├── audit-log/          Audit log query endpoint
    ├── dashboard/          Analytics endpoints
    ├── category/           Category CRUD
    ├── product/            Product CRUD
    └── customer-profile/   Customer self-service profile
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
| `userType` | `UserType` | `ADMIN` \| `STAFF` \| `CUSTOMER` — Default `CUSTOMER` |
| `roleId` | `Int?` FK → `roles.id` | Null for `CUSTOMER` users (no RBAC) |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### `customer_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | Auto-increment |
| `userId` | `Int` unique FK → `users.id` | One-to-one with user |
| `fullName` | `String?` | |
| `phone` | `String?` | |
| `address` | `String?` | |
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

### `categories`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | Auto-increment |
| `name` | `String` unique | |
| `description` | `String?` | |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### `products`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `Int` PK | Auto-increment |
| `name` | `String` | |
| `description` | `String?` | |
| `price` | `Decimal(10,2)` | Non-negative |
| `stock` | `Int` | Default `0` |
| `status` | `ProductStatus` | `ACTIVE` \| `INACTIVE` — Default `ACTIVE` |
| `images` | `String[]` | Array of image URLs |
| `categoryId` | `Int` FK → `categories.id` | |
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

Shop page login. Only `CUSTOMER` accounts are accepted.

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

**Errors:** `400` validation, `401` invalid credentials or non-customer account.

---

#### `POST /v1/auth/admin/login` — Public

Admin panel login. Only `ADMIN` and `STAFF` accounts are accepted.

**Request body:**
```json
{ "username": "admin", "password": "admin-password" }
```

**Response `200`:** Same as shop login — returns `{ accessToken }`.

The issued JWT will contain the user's RBAC `permissions` array.

**Errors:** `400` validation, `401` invalid credentials or customer account.

---

#### `POST /v1/auth/register` — Public

Register a new **customer** account (shop page only). Admin/staff accounts cannot be self-registered.

**Request body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "my-password",
  "name": "Alice"
}
```

`accountType` is automatically set to `LOCAL`. `userType` is automatically set to `CUSTOMER`.

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
| `userType` | enum | `ADMIN` \| `STAFF` \| `CUSTOMER` |
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
    "dashboard:read": "Read dashboard",
    "category:create": "Create category",
    "category:read": "Read category",
    "category:update": "Update category",
    "category:delete": "Delete category",
    "product:create": "Create product",
    "product:read": "Read product",
    "product:update": "Update product",
    "product:delete": "Delete product"
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

### Categories

#### `POST /v1/categories` — `category:create`

> Requires authentication + `category:create` permission.

Create a new category.

**Request body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

---

#### `GET /v1/categories` — Public

List all categories. No authentication required.

---

#### `GET /v1/categories/:id` — Public

Get a single category by ID. No authentication required.

**Errors:** `404` if not found.

---

#### `PATCH /v1/categories/:id` — `category:update`

Update a category. All fields are optional.

**Errors:** `404` if not found.

---

#### `DELETE /v1/categories/:id` — `category:delete`

Delete a category by ID.

**Errors:** `404` if not found, `400` if referenced by existing products (FK constraint).

---

### Products

#### `POST /v1/products` — `product:create`

> Requires authentication + `product:create` permission.

Create a new product.

**Request body:**
```json
{
  "name": "Wireless Headphones",
  "description": "Noise-cancelling over-ear headphones",
  "price": 199.99,
  "stock": 50,
  "status": "ACTIVE",
  "images": ["https://example.com/img1.jpg"],
  "categoryId": 1
}
```

`status` defaults to `ACTIVE` if omitted. `stock` defaults to `0`.

---

#### `GET /v1/products` — Public

List products with optional filters and pagination. No authentication required.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `name` | string | Case-insensitive partial match |
| `status` | enum | `ACTIVE` \| `INACTIVE` |
| `categoryId` | number | Filter by category |
| `page` | number | Default `1` |
| `limit` | number | Default `10` |

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Wireless Headphones",
        "price": "199.99",
        "stock": 50,
        "status": "ACTIVE",
        "images": ["https://example.com/img1.jpg"],
        "categoryId": 1,
        "category": { "id": 1, "name": "Electronics" },
        "createdAt": "2026-05-13T00:00:00.000Z",
        "updatedAt": "2026-05-13T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "timestamp": "..."
}
```

---

#### `GET /v1/products/:id` — Public

Get a single product by ID. No authentication required. Includes the related `category` object.

**Errors:** `404` if not found.

---

#### `PATCH /v1/products/:id` — `product:update`

Update a product. All fields are optional.

**Errors:** `404` if not found.

---

#### `DELETE /v1/products/:id` — `product:delete`

Delete a product by ID.

**Errors:** `404` if not found.

---

### Customer Profile

> Requires authentication (CUSTOMER JWT only). `ADMIN` / `STAFF` tokens are rejected with `403`.

#### `GET /v1/customer/profile`

Return the authenticated customer's profile.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "userId": 5,
    "fullName": "Alice Smith",
    "phone": "+1234567890",
    "address": "123 Main St",
    "createdAt": "2026-05-14T00:00:00.000Z",
    "updatedAt": "2026-05-14T00:00:00.000Z"
  },
  "timestamp": "..."
}
```

**Errors:** `403` non-customer token, `404` profile not yet created.

---

#### `PUT /v1/customer/profile`

Create or update the authenticated customer's profile (upsert). All fields are optional.

**Request body:**
```json
{
  "fullName": "Alice Smith",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Response `200`:** Updated profile object.

**Errors:** `403` non-customer token, `400` validation.

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
  "userType": "ADMIN",
  "permissions": ["user:read", "role:read"]
}
```

- `userType` — always present; one of `ADMIN`, `STAFF`, `CUSTOMER`.
- `permissions` — loaded from the user's role at login time. Empty array `[]` for `CUSTOMER` users (no RBAC).
- Use `"permissions": ["*"]` on a role to grant full admin access.

### User type rules

| `userType` | Login endpoint | RBAC | Self-register |
|-----------|---------------|------|---------------|
| `CUSTOMER` | `POST /auth/login` | ✗ | ✅ |
| `STAFF` | `POST /auth/admin/login` | ✅ | ✗ |
| `ADMIN` | `POST /auth/admin/login` | ✅ | ✗ |

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
| `CategoryQueries` | `find`, `findOne`, `findUnique`, `count` |
| `CategoryRepository` | `create`, `update`, `delete` |
| `ProductQueries` | `find`, `findOne`, `findUnique`, `count` |
| `ProductRepository` | `create`, `update`, `delete` |
| `CustomerProfileQueries` | `findOne`, `findUnique` |
| `CustomerProfileRepository` | `create`, `update`, `upsert` |

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
