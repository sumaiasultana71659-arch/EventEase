# EventEase – Backend API

Express + TypeScript + Prisma + MySQL. Serves the EventEase React frontend.

- Port: `8080` · Base URL: `http://localhost:8080/api`
- Auth: JWT (`Authorization: Bearer <token>`), roles `organizer` and `guest`
- Full setup (Banglish, step by step): see **BACKEND-GUIDE.md**

## Quick start
```bash
npm install
cp .env.example .env            # then edit DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run db:seed                 # demo accounts: organizer@eventease.com / guest@eventease.com (demo123)
npm run dev
```
Health check: http://localhost:8080/api/health

## Scripts
| Script | What it does |
|---|---|
| `npm run dev` | start with auto restart |
| `npm run build` / `npm start` | compile to `dist/` and run |
| `npm run db:migrate` | create/update tables from `prisma/schema.prisma` |
| `npm run db:seed` | insert demo data (skipped if it already exists) |
| `npm run db:studio` | browse the database in the browser |

## Endpoints
See the table in BACKEND-GUIDE.md section 7. Responses use `_id` (not `id`) and
`event.allocation = { venue, food, decoration, transportation, misc }`, which is what the frontend expects.

## New in v3: admin + event requests
- Roles: `admin`, `organizer` (the normal user) and `guest`. Admin accounts are only created by the seed.
- User: `GET/POST /api/requests`, `DELETE /api/requests/:id`, `POST /api/ai/suggestions`, preferences via `PUT /api/auth/me {preferences}`.
- Admin: `GET /api/admin/stats|requests|users|events`, `PUT /api/admin/requests/:id/approve|reject`.
- Approving a request creates the Event (with AI budget split, starter tasks and schedule) for the requesting user.
- Demo admin: `admin@eventease.com` / `demo123` (after `npm run db:seed`).
