# DemoSourcing – Tender Submission Portal

**Domain:** `demosourcing.atenxion.ai`

A production-ready Tender Submission Portal built as a monorepo with:

- **Frontend:** Next.js 14 (App Router) + Material UI
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Auth:** JWT + Role-Based Access Control (RBAC)

---

## Monorepo Structure

```
demosourcing-portal/
├── backend/          # Node.js + Express API
└── frontend/         # Next.js App Router UI
```

## User Roles

| Role         | Capabilities                                                         |
|--------------|----------------------------------------------------------------------|
| Admin        | Manage all users (Create / Update / Deactivate Vendors & Company Users) |
| Company User | Create/manage Tenders, review Proposals, add remarks & status        |
| Vendor       | View active Tenders, upload PDF Proposals, manage own submissions    |

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET
npm install
npm run dev                 # nodemon
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev                        # http://localhost:3000
```

---

## API Overview

| Method | Endpoint                          | Role               | Description                   |
|--------|-----------------------------------|--------------------|-------------------------------|
| POST   | `/api/auth/login`                 | Public             | Login, returns JWT            |
| GET    | `/api/auth/me`                    | Authenticated      | Get current user profile      |
| GET    | `/api/admin/users`                | Admin              | List all users                |
| POST   | `/api/admin/users`                | Admin              | Create user                   |
| PUT    | `/api/admin/users/:id`            | Admin              | Update user                   |
| PATCH  | `/api/admin/users/:id/deactivate` | Admin              | Deactivate user               |
| GET    | `/api/tenders`                    | Authenticated      | List tenders                  |
| POST   | `/api/tenders`                    | Company User       | Create tender                 |
| PUT    | `/api/tenders/:id`                | Company User       | Update tender                 |
| DELETE | `/api/tenders/:id`                | Company User       | Delete tender                 |
| POST   | `/api/proposals`                  | Vendor             | Submit proposal (PDF upload)  |
| GET    | `/api/proposals/my`               | Vendor             | My submitted proposals        |
| GET    | `/api/proposals/tender/:tenderId` | Company User       | Proposals for a tender        |
| PUT    | `/api/proposals/:id`              | Vendor             | Replace proposal PDF          |
| DELETE | `/api/proposals/:id`              | Vendor             | Delete proposal               |
| PATCH  | `/api/proposals/:id/status`       | Company User       | Update proposal status/remark |
