# Estate Access Control

Production-oriented Next.js App Router application for residential visitor permits, gate verification, entry/exit logging, notifications and audit trails.

## Architecture
- Next.js + TypeScript
- PostgreSQL + Prisma in production
- Signed HTTP-only session cookie
- Server-side role enforcement
- Secure random QR tokens stored hashed in PostgreSQL
- Demo mode for browser validation when no database credentials are available

## Run locally
1. Copy `.env.example` to `.env.local`.
2. For UI/demo mode keep `DEMO_MODE=true` and `AUTH_SECRET` set.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

## Production database
Set `DATABASE_URL` to a managed PostgreSQL database (Supabase/Neon/etc.) and set `DEMO_MODE=false`.
Run `npm run db:generate`, `npm run db:push` (or use a reviewed migration workflow), then `npm run db:seed` only for non-production demo data.

## Required environment variables
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — high entropy session signing secret
- `NEXT_PUBLIC_APP_URL` — deployed app URL
- `DEMO_MODE` — `true` only for development/demo
- Demo credential variables only when DEMO_MODE is true

## Security notes
- Residents are scoped to their own permits in production queries.
- Guard actions are server-authorised and gate-aware.
- QR data is validated server-side; the QR contains a random token, not private profile data.
- Audit events are append-only from application roles.
- Retention is represented by the `SystemSetting` table and should be enforced by a scheduled cleanup job before live deployment.
- Rate limiting and CAPTCHA/abuse controls should be added at the edge before public internet launch.

## Current limitations
- This repository uses a demo in-memory adapter when `DEMO_MODE=true`; it is not persistent and must never be used for live estate operations.
- The production PostgreSQL repository is implemented for core permit/verification/entry/exit/notification flows; full CRUD admin screens and CSV import should be completed before operational deployment.
- Camera scanning UI is scaffolded with a browser-friendly verification surface; a dedicated QR decoder package should be enabled after device/browser acceptance testing.
- Email/SMS/WhatsApp providers are intentionally abstracted/not configured.
