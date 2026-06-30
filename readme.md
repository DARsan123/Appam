# IIM Lucknow Visitor Management System (VMS)

A full-stack Visitor Management System built per the IIML VMS PRD — covering pre-registration, approval workflows, gate check-in/out, bulk events, blacklist management, offline gate operations, audit logging, and DPDP-compliant public registration.

## Architecture

| Component | Tech | Port | Purpose |
|-----------|------|------|---------|
| **Backend API** | NestJS + PostgreSQL + TypeORM | 3000 | Core API, RBAC, audit, sync |
| **Admin/Host Portal** | React + Vite | 5173 | Role-based web portal |
| **Gate Console (PWA)** | React + Vite + Dexie.js | 5174 | Offline-capable kiosk check-in |
| **Public Registration** | React + Vite | 5175 | OTP-gated visitor self-registration |

## PRD Features Implemented

- **Pre-registration & approval** — Host visit requests, configurable approval levels, VIP bypass
- **Public self-registration** — QR link, OTP verification, DPDP consent (EN/HI)
- **Gate operations** — QR check-in/out, walk-in registration, badge preview, event fast-lane
- **Offline mode** — IndexedDB queue, gate cache sync, staleness warning (2hr SLA)
- **Multi-campus** — Lucknow + Noida campuses with location-scoped data
- **Bulk upload** — CSV attendee import for events with QR generation
- **Blacklist** — Institute-wide + campus-scoped entries with reason codes
- **Real-time visibility** — On-campus dashboard, headcount export
- **Reports** — Daily counts, gate traffic, overdue checkouts
- **Audit log** — Hash-chained tamper-evident log with verification endpoint
- **RBAC** — 7 roles: Host, Gate Security, Security Supervisor, Admin, Compliance, Event Coordinator

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional — for PostgreSQL in production; SQLite used by default for local dev)

### 1. Start database (optional — production)

For PostgreSQL, set `DB_TYPE=postgres` in `backend/.env` and run:

```bash
docker compose up -d
```

By default the app uses SQLite (`iiml_vms.sqlite`) — no Docker required.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure backend

```bash
cp backend/.env.example backend/.env
```

### 4. Seed demo data

```bash
npm run seed
```

### 5. Run all services

```bash
npm run dev
```

Or run individually:

```bash
npm run dev:api       # http://localhost:3000/api
npm run dev:portal    # http://localhost:5173
npm run dev:gate      # http://localhost:5174
npm run dev:register  # http://localhost:5175
```

## Demo Accounts

All passwords: `password123`

| Email | Role |
|-------|------|
| admin@iiml.ac.in | Admin |
| host@iiml.ac.in | Host (Lucknow) |
| security@iiml.ac.in | Gate Security |
| supervisor@iiml.ac.in | Security Supervisor |
| coordinator@iiml.ac.in | Event Coordinator |
| compliance@iiml.ac.in | Compliance (read-only audit) |
| host.noida@iiml.ac.in | Host (Noida) |
| security.noida@iiml.ac.in | Gate Security (Noida) |

## Typical Workflow

1. **Host** logs into portal → creates visit → shares QR registration link with visitor
2. **Visitor** opens link → completes ID details + OTP + DPDP consent
3. **Host** approves visit (if pending)
4. **Security** at gate console scans QR → badge prints → host gets arrival SMS
5. **Security** scans QR again at checkout (or auto-flagged if overdue)

## API Endpoints

- `POST /api/auth/login` — Authentication
- `POST /api/visits` — Create visit request
- `GET /api/visits/on-campus` — Live campus occupancy
- `POST /api/checkin` — Gate check-in
- `POST /api/checkin/sync` — Offline event reconciliation
- `GET /api/sync/gate-cache` — Gate edge cache (blacklist + directory)
- `POST /api/bulk/upload` — CSV bulk registration
- `GET /api/public/visit/:token` — Public registration lookup
- `GET /api/audit/verify` — Verify hash chain integrity

## Production Notes

- Replace JWT secret and configure Azure AD SSO (FR23)
- Connect institutional SMS/email gateway (FR26)
- Schedule HRMS/ERP directory sync (FR24)
- Enable Redis for fast-lane cache (architecture Section 6.4)
- Configure S3-compatible storage for ID documents (NFR4)
