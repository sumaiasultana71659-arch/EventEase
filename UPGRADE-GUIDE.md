# EventEase v3.1 – Upgrade guide (Banglish)

## v3.1 e ki bodleche
- **Landing page** ekhon shudhu customer er jonno (Mindy Weiss er moto): hero photo slider, about, event types, planning tools, ideas, CTA. Admin flow / fake card / fake number shob bad.
- **Admin login alada:** `http://localhost:5173/admin/login` (public page e kono link nai). Normal `/login` e admin dhukte pare na.
- **Admin credentials code/.env e:** `eventease-backend/.env` e `ADMIN_EMAIL` / `ADMIN_PASSWORD` (na dile default: `admin@eventease.com` / `Eventease@Admin2026`). `npm run db:seed` chalale oi password set hoy.
- **Admin > Admins** page: notun admin add kora jay.
- **Admin dashboard:** upore "Needs your attention" (pending requests + Review button), tarpor stats ar chart.
- **AI suggestion realistic:** 17 ta event format, budget er sathe real cost mele; budget kom hole guest sankhya kombiye ba "Tight fit" bole, onek kom hole shotti kotha bole; cost breakdown, kon jinish included, kotha age book korte hobe.
- **Colour:** dark slate + warm sand + muted clay/sage, shob solid colour, gradient nai.



## Ki ki change hoyeche
**Flow ekhon:** User login kore budget/preferences dey -> AI suggestion dekhe (ba nijer idea likhe) -> **request** pathay -> **Admin approve/reject** kore -> approve hole user er dashboard e event create hoye jay (AI budget split + starter tasks + schedule shoho) -> user guests, tasks, budget, expenses manage kore.

| Role | Ki korte pare |
|---|---|
| Admin | Dashboard (stats + chart), Requests inbox (approve / budget-venue-date adjust / reject with note), All events, Users |
| User (organizer) | Preferences, AI suggestions (Discover), event request, My requests, tarpor shob planning page |
| Guest | Invitation dekhe, accept/decline |

Notun/porivortito file:
- Backend: `prisma/schema.prisma`, `routes/requests.ts`, `routes/admin.ts`, `routes/ai.ts` (+suggestions), `routes/auth.ts` (+preferences), `services/ai.ts`, `prisma/seed.ts`, `app.ts`
- Frontend: `pages/Landing.jsx`, `AuthShell.jsx`, `Discover.jsx`, `Requests.jsx`, `UserHome.jsx`, `AdminDashboard.jsx`, `AdminRequests.jsx`, `AdminLists.jsx`, `Events.jsx`, `components/Layout.jsx`, `Img.jsx`, `Reveal.jsx`, `RequestModal.jsx`, `SuggestionCard.jsx`, `data/images.js`, `styles/v3.css`

## Database: notun kore korte hobe na
Same MySQL database, same backend. Shudhu **ekta migration** chalate hobe (notun table `EventRequest`, `User` e preference column, `Role` e `admin`). Purano data thakbe.

```bash
cd eventease-backend
npm install
npx prisma migrate dev --name admin_requests
npm run db:seed      # admin + demo users + sample requests add kore (purano data delete kore na)
npm run dev

cd ../eventease-frontend
npm install
npm run dev
```
Migration e "drift" error dile (last option, **sob data muche jabe**): `npx prisma migrate reset` tarpor `npm run db:seed`.

## Demo login (password: demo123)
- `admin@eventease.com` – admin
- `organizer@eventease.com` – user (already preferences + 2 events ache)
- `ayesha@mail.com`, `hasan@mail.com`, `tania@mail.com` – notun user, pending request ache (admin diye approve kore dekho)
- `guest@eventease.com` – guest

Admin diye login -> Requests -> Review -> Approve. Tarpor user diye login korle event dashboard e chole ashbe.

## Images
Photo gulo Unsplash theke load hoy (internet lagbe). Kono photo load na hole automatic SVG artwork dekhay, tai page kokhono broken dekhay na. Nijer photo use korte: `public/images/` e file rakho, `src/data/images.js` e URL bodlao (`'/images/wedding.jpg'`).

## Jani na / sima
- `USE_MOCK: true` mode e admin/requests/AI suggestion kaj korbe na (egula real backend lage). `config.js` e `USE_MOCK: false` rakho.
- Admin account register page theke banano jay na (security). Notun admin lagle database e user er `role` `admin` kore dao.
- AI suggestion ekhon rule-based (budget, guests, type, style, city diye). Real AI (Claude/OpenAI) lagate `services/ai.ts` er `suggestions()` replace korlei hobe, route/frontend same thakbe.
