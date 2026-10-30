# EventEase

An event management website. Users share their budget and preferences, view AI suggestions or request an event from the admin. The admin reviews each request, approves it and then manages the event (guests, tasks, schedule, budget, expenses).

## Tech stack
- **Frontend:** React (Vite)
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** MySQL

## Team
| Member | GitHub | Part |
|---|---|---|
| Sumaia Sultana | sumaiasultana71659-arch | Auth, landing, guests, tasks (branch `feature/member1-auth-planning`) |
| Nuzhat Tahsin | nuzhat04-git | Admin dashboard and requests (branch `feature/member2-admin`) |
| Nusayba Haque | nusayba1226 | User flow, AI, finance (branch `feature/member3-user-ai-finance`) |

## Run locally
**Backend** (`eventease-backend`)
1. Start MySQL (XAMPP) and create a database named `eventease`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run db:seed`
6. `npm run dev` (runs on http://localhost:8080)

**Frontend** (`eventease-frontend`)
1. `npm install`
2. `npm run dev` (runs on http://localhost:5173)

Admin login page: `/admin/login` (account comes from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`).

## Git workflow
`main` (final) <- `develop` <- `feature/*` branches, merged with Pull Requests. See `TEAM-WORKFLOW.md`.