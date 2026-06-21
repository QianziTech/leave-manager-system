# CLAUDE.MD

## Project Overview

Leave Management System — internal enterprise leave approval workflow for course design project. Built with Nuxt 4 full-stack (Nitro server + Vue 3 frontend). The entire system runs with a single `pnpm dev` command.

## Tech Stack

- **Framework**: Nuxt 4.x (full-stack, SSR enabled)
- **UI**: Ant Design Vue 4.x
- **Database**: SQLite via better-sqlite3 (file at `.data/leave-manager.db`, zero-config)
- **Auth**: JWT via jose (HS256, 24h expiry), password hashing via bcryptjs
- **Date handling**: dayjs
- **Package manager**: pnpm

## Directory Conventions (Nuxt 4)

| Directory              | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `app/pages/`         | File-based routing                                 |
| `app/layouts/`       | Page layouts (default.vue, auth.vue)               |
| `app/components/`    | Auto-imported Vue components                       |
| `app/composables/`   | Auto-imported composables (useAuth)                |
| `app/middleware/`    | Route middleware (auth, admin)                     |
| `app/plugins/`       | Vue plugins (ant-design)                           |
| `server/api/`        | Nitro API routes (auto-registered under `/api/`) |
| `server/utils/`      | Server utilities (db, jwt, auth)                   |
| `server/middleware/` | Server middleware (JWT auth check)                 |

## Business Rules (Critical)

### Approval Flow

- **Short leave (≤ 3 days)**: Single-level approval by direct supervisor (level 1)
- **Long leave (> 3 days)**: Two-level approval — supervisor (level 1) → department head (level 2)
- Approval records are created automatically when a leave is submitted based on duration

### Leave Lifecycle

- Submitted → `pending`
- No "draft" state — all submissions are final
- **Pending** requests CAN be modified or withdrawn by the requester
- **Rejected** requests must be re-submitted as a new leave (cannot be edited)
- Withdrawal is a soft state change to `withdrawn` (not hard delete)

### Data Constraints

- Leave duration minimum: **0.5 day**
- Four leave types: `sick`, `personal`, `annual`, `other`
- Four user roles: `employee`, `supervisor`, `dept_head`, `admin`
- User soft delete via `active` column

## Database

- SQLite file: `.data/leave-manager.db` (auto-created, gitignored)
- Tables: `users`, `leaves`, `approvals`
- WAL mode + foreign keys enabled
- Default admin: `admin` / `admin123`
- Schema initialized in `server/utils/db.ts::initSchema()`

## API Endpoints

| Method | Path                           | Auth  | Description                           |
| ------ | ------------------------------ | ----- | ------------------------------------- |
| POST   | `/api/auth/login`            | No    | Login, sets httpOnly `token` cookie |
| POST   | `/api/auth/register`         | Admin | Create user (admin only)              |
| GET    | `/api/auth/me`               | Yes   | Get current user                      |
| GET    | `/api/leaves`                | Yes   | List leaves (role-filtered)           |
| POST   | `/api/leaves`                | Yes   | Create leave                          |
| GET    | `/api/leaves/:id`            | Yes   | Leave detail with approvals           |
| PUT    | `/api/leaves/:id`            | Yes   | Modify pending leave (owner only)     |
| DELETE | `/api/leaves/:id`            | Yes   | Withdraw pending leave (owner only)   |
| GET    | `/api/approvals/pending`     | Yes   | Pending approvals for current user    |
| POST   | `/api/approvals/:id/approve` | Yes   | Approve                               |
| POST   | `/api/approvals/:id/reject`  | Yes   | Reject                                |
| GET    | `/api/users`                 | Admin | List users                            |
| POST   | `/api/users`                 | Admin | Create user                           |
| GET    | `/api/users/:id`             | Admin | Get user                              |
| PUT    | `/api/users/:id`             | Admin | Update user                           |
| DELETE | `/api/users/:id`             | Admin | Soft-delete user                      |

## Frontend Pages

| Path             | Page                           | Middleware   |
| ---------------- | ------------------------------ | ------------ |
| `/login`       | Login form                     | none         |
| `/`            | Redirect                       | auth         |
| `/apply`       | Leave application form         | auth         |
| `/records`     | Leave records table            | auth         |
| `/records/:id` | Leave detail + approvals       | auth         |
| `/approvals`   | Pending approvals list         | auth         |
| `/profile`     | User profile + change password | auth         |
| `/admin/users` | User CRUD                      | auth + admin |

## Key Patterns

- **Server DB**: Always use `getDb()` from `server/utils/db.ts` — it returns a singleton
- **Server auth**: `event.context.user` is set by `server/middleware/auth.ts` for all protected routes
- **Frontend auth**: `useAuth()` composable manages user state via `useState('auth:user')`
- **API calls**: Use auto-imported `$fetch` — cookies are sent automatically
- **Ant Design**: Components are globally registered via plugin, no imports needed in templates
- **Route metadata**: Use `definePageMeta({ middleware: 'auth' })` for protected pages

## Development Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm preview      # Preview production build
```
