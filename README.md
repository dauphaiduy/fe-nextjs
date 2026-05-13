# fe-nextjs

A Next.js 16 admin dashboard with role-based access control, built with Ant Design, Auth.js (NextAuth v5), Firebase, and Zustand.

## Tech Stack

| Layer | Library / Version |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | Ant Design 6 + Tailwind CSS 4 |
| Auth | Auth.js (NextAuth v5 beta) |
| State | Zustand 5 |
| HTTP | Axios |
| Storage | Firebase 12 |
| Language | TypeScript 5 |

## Features

- **Authentication** — credential-based login via the backend API; JWT decoded client-side for permission claims
- **Role-based access control** — permission helpers (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`) guard every route and UI element
- **Protected layout** — collapsible sidebar with per-item permission checks; routes redirect to `/login` when unauthenticated
- **Modules** — Dashboard, Users, Roles, Categories, Products, Audit Logs

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A running backend API (see `docs/BE_DOCUMENT.md`)

### Installation

```bash
npm install
```

### Environment Variables

Copy the example file and fill in the values:

```bash
cp env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:3000/v1`) |
| `AUTH_SECRET` | Auth.js secret — generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/dashboard` when authenticated or `/login` otherwise.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Public routes (login)
│   ├── (protected)/      # Auth-guarded routes
│   └── api/auth/         # Auth.js route handler
├── components/
│   ├── common/           # Empty state, error, loading
│   ├── layout/           # Header, Sidebar, Content
│   ├── providers/        # SessionProvider wrapper
│   └── ui/               # Button, Form, Modal, Table
├── modules/              # Feature modules (auth, roles, users, …)
├── services/             # API service layer (axios clients)
├── store/                # Zustand stores (auth, ui)
├── types/                # Shared TypeScript types
└── utils/                # Constants, helpers, permission utilities
```
