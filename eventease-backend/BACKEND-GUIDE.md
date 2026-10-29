# EventEase Backend – Details Guide (Banglish)

Stack: **Node.js + Express + TypeScript + Prisma + MySQL** · Port: **8080** · API base: `http://localhost:8080/api`

---

## 0. Ki baniyechi
React frontend (`eventease-frontend`) ekhon fake database (localStorage) use kore. Ei backend sei fake-er jaygay **asol MySQL database** dey.
Frontend-er page-e kono code change lagbe na, shudhu `src/config.js` e `USE_MOCK: false` korte hobe.

```
React (localhost:5173)  --HTTP/JSON-->  Express API (localhost:8080)  --Prisma-->  MySQL (localhost:3306)
```

---

## 1. Ki ki install lagbe (ekbar)

| Jinish | Keno | Kothay pabe |
|---|---|---|
| Node.js LTS | code chalate (apnar ager-i ache) | nodejs.org |
| **MySQL** | database | Option A: MySQL Installer (dev.mysql.com/downloads/installer) · Option B (shohoj): **XAMPP** (apachefriends.org) |
| MySQL Workbench *(optional)* | database chokhe dekhar jonno | MySQL Installer-er shathe ashe |
| Git | branching | git-scm.com |
| Postman *(optional)* | API test | postman.com |

### MySQL install (Windows, Option A)
1. MySQL Installer chalan -> **Server only** (ba Developer Default) -> Next.
2. "Accounts and Roles"-e **root password** dite bolbe. Ekta password dik ar **mone rakhun** (porer step-e lagbe).
3. Port **3306** thakbe (default). Finish.
4. Check: Start menu-te "MySQL 8.x Command Line Client" khule password dile `mysql>` ashbe.

### XAMPP (Option B, onek shohoj)
1. XAMPP install korun -> XAMPP Control Panel kholen -> **MySQL**-er pashe **Start** chapun (shobuj hobe).
2. XAMPP-te root password **faka (empty)** thake. Tai `.env`-e password-er jaygay kichu likhben na.

### Mac
```bash
brew install mysql
brew services start mysql
```

---

## 2. Step by step setup

### Step 1: Database banan
**Workbench / Command Line Client diye:**
```sql
CREATE DATABASE eventease;
```
**XAMPP hole:** browser-e `http://localhost/phpmyadmin` -> **New** -> Database name `eventease` -> Create.

### Step 2: Project kholen
1. `eventease-backend.zip` unzip korun.
2. VS Code -> **File -> Open Folder** -> `eventease-backend`.
3. **Terminal -> New Terminal**.

> Frontend ar backend **alada alada folder**, alada alada terminal. Duto-i ek shathe chalu thakbe.

### Step 3: Package install
```bash
npm install
```
Kichu minute lagbe. Shesh-e `prisma generate` nijei chole (ekta "Generated Prisma Client" message ashbe).

### Step 4: `.env` file banan
1. `.env.example` file-ta copy kore nam din **`.env`** (shamner dot shoho, `.txt` na).
   VS Code-er left explorer-e right-click -> Copy, Paste, Rename.
2. `.env` kholen ar change korun:

```env
DATABASE_URL="mysql://root:AMAR_PASSWORD@localhost:3306/eventease"
PORT=8080
JWT_SECRET="ekta-boro-random-lekha-jemon-x8Kd92LmQp7sVt4Z"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
CURRENCY="$"
```
- `AMAR_PASSWORD` -> MySQL root password. XAMPP hole faka: `mysql://root:@localhost:3306/eventease`
- Password-e `@ : / # ?` thakle URL-encode korte hobe (`@` -> `%40`).
- `JWT_SECRET` ekta lomba random lekha dik. Eta kauke dekhaben na.

### Step 5: Table toiri
```bash
npx prisma migrate dev --name init
```
Eta `prisma/schema.prisma` pore MySQL-e 6-ta table baniye dey (`User, Event, Guest, Task, Activity, Expense`). Shesh-e `Your database is now in sync with your schema` dekhabe.

### Step 6: Demo data boshan
```bash
npm run db:seed
```
Eta duto demo account ar ekta sample event baniye dey:
- `organizer@eventease.com` / `demo123`
- `guest@eventease.com` / `demo123`

(Eta na korle frontend-er **Fill organizer / Fill guest** button kaj korbe na, karon database-e oi user nai.)

### Step 7: Server chalan
```bash
npm run dev
```
Ashbe: `EventEase API running on http://localhost:8080/api`

Browser-e kholen: **http://localhost:8080/api/health** -> `{"status":"ok"}` dekhale backend thik ache.
Terminal bondho korben na. Code save korle server nijei restart hoy.

---

## 3. Frontend-ke backend-er shathe jora
1. Frontend folder-e `src/config.js` kholen:
```js
export const CONFIG = {
  USE_MOCK: false,                      // <- true chhilo, false korun
  API_URL: 'http://localhost:8080/api', // <- eta-i thik ache
  CURRENCY: '$'
};
```
2. Browser-e frontend khule **F12 -> Application -> Local Storage -> Clear all** (ager fake login-er token muchte).
3. Frontend chalan (alada terminal-e): `npm run dev`
4. `http://localhost:5173` -> Login -> **Fill organizer** -> Log in.

Ekhon je data add korben (event, guest, task...) shob **MySQL-e save hobe**. Browser bondho kore abar khulleo thakbe.

---

## 4. Test korbe kibhabe

### Database-e data dekha
```bash
npm run db:studio
```
Browser-e `http://localhost:5555` khulbe. Table-gulo click kore data dekhte/edit korte paren.
(Ba MySQL Workbench / phpMyAdmin diye `eventease` database.)

### Postman diye API test
1. **POST** `http://localhost:8080/api/auth/login` -> Body -> raw -> JSON:
```json
{ "email": "organizer@eventease.com", "password": "demo123" }
```
Response-e `token` ashbe, copy korun.
2. **GET** `http://localhost:8080/api/events` -> **Authorization** tab -> Type **Bearer Token** -> token paste -> Send. Event list ashbe.

### Terminal diye (Mac / Git Bash)
```bash
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"organizer@eventease.com","password":"demo123"}'
```

---

## 5. Folder structure
```
eventease-backend/
  .env                  <- apnar secret config (git-e jay na)
  package.json          <- dependency + script (npm run dev ...)
  tsconfig.json         <- TypeScript setting
  prisma/
    schema.prisma       <- database table-er design
    seed.ts             <- demo data
  src/
    server.ts           <- app chalu kore (port 8080)
    app.ts              <- middleware + shob route jora
    config.ts           <- .env theke setting pore
    prisma.ts           <- database connection
    middleware/
      auth.ts           <- login check (JWT) + role check
      error.ts          <- shob error ekhane, { message } hishebe jay
    routes/
      auth.ts           <- register, login, me
      events.ts         <- event CRUD + ai-summary
      resources.ts      <- guests / tasks / activities / expenses (4-ta ek file-e)
      invitations.ts    <- guest-er invitation + RSVP
      ai.ts             <- 4 ta AI endpoint
    services/ai.ts      <- AI logic (ekhon rule-based)
    utils/
      serialize.ts      <- database row -> frontend format (_id, allocation)
      ownership.ts      <- "ei event ki ei organizer-er?" check
      asyncHandler.ts   <- async error dhorar helper
    types/express.d.ts  <- req.user TypeScript-ke chenano
```

---

## 6. Ekta request kemne ghore (Guest add korle)
Frontend: `POST /api/events/abc123/guests` + header `Authorization: Bearer <token>` + body `{name, email, ...}`

1. `app.ts` -> `/events` route-e dhoke
2. `requireAuth` : token verify -> database theke user ane -> `req.user` set
3. `requireRole('organizer')` : organizer na hole **403**
4. `nestedRouter('guests')` (`resources.ts`) -> `getOwnedEvent` : event ta ei user-er na hole **404**
5. **zod** body check kore (name khali / email bhul hole **400** + message) -> email lowercase
6. Prisma `guest.create(...)` -> MySQL-e INSERT
7. `serialize()` -> `_id` bosiye frontend-e pathay

### Role niyom
| Route | Organizer | Guest |
|---|---|---|
| `/auth/*` | yes | yes |
| `/events`, `/guests`, `/tasks`, `/activities`, `/expenses`, `/ai` | yes (shudhu **nijer** event) | 403 |
| `/my-invitations` | 403 | yes (nijer email-er invitation) |

---

## 7. API list
Base: `http://localhost:8080/api` · Protected route-e `Authorization: Bearer <token>`

| Method | Path | Kaj |
|---|---|---|
| GET | /health | server thik ache kina |
| POST | /auth/register | `{name,email,password,role}` -> `{token,user}` |
| POST | /auth/login | `{email,password}` -> `{token,user}` |
| GET, PUT | /auth/me | nijer profile / update |
| GET, POST | /events | list / create |
| GET, PUT, DELETE | /events/:id | ekta event |
| GET, POST | /events/:id/guests, /tasks, /activities, /expenses | list / add |
| PUT, DELETE | /guests/:id, /tasks/:id, /activities/:id, /expenses/:id | update / delete |
| GET | /my-invitations | guest-er invitation |
| PUT | /my-invitations/:guestId/rsvp | `{rsvp}` |
| POST | /ai/plan, /ai/budget, /ai/tasks, /ai/schedule | AI suggestion |
| GET | /events/:id/ai-summary | AI summary |

---

## 8. Error holle ki korbe

| Error | Karon | Solution |
|---|---|---|
| `Can't reach database server at localhost:3306` | MySQL chalu nai | MySQL service / XAMPP-te Start chapun |
| `Authentication failed ... credentials` | `.env`-e password bhul | `DATABASE_URL`-er password thik korun |
| `Unknown database eventease` / `P1003` | database banano hoyni | Step 1 |
| `JWT_SECRET is missing` | `.env` nai ba nam bhul (`.env.txt`?) | `.env` nam thik korun, server restart |
| `EADDRINUSE: address already in use :::8080` | 8080 onno program-e | `.env`-e `PORT=8081` + frontend `API_URL` 8081 |
| `permission denied ... shadow database` | MySQL user-er permission kom | `root` user use korun |
| Login-e `Invalid email or password` (demo account) | seed chalano hoyni | `npm run db:seed` |
| Browser-e CORS error | `CLIENT_URL` mile na | `.env`-e frontend URL thik korun, **backend restart** |
| Frontend login kore-i abar login page-e fire ashe | ager fake token | Local Storage clear korun |
| `running scripts is disabled` (PowerShell) | Windows policy | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ba CMD use korun |
| `EPERM ... prisma` (Windows) | server chalu obosthay generate | Server (Ctrl+C) bondho kore abar chalan |

`.env` change korle shobshomoy **backend restart** korte hobe (Ctrl+C -> `npm run dev`).

---

## 9. Prisma command cheat sheet
```bash
npx prisma migrate dev --name <kaj>   # schema change korle: table update + migration file
npx prisma migrate reset              # DATABASE-ER SHOB DATA MUCHE notun kore (seed shoho)
npm run db:seed                       # demo data
npm run db:studio                     # database browser-e dekha
```
Notun column lagle `prisma/schema.prisma` e likhe `migrate dev` chalan.

---

## 10. Git branching
```
main        <- stable release (v1.0.0)
develop     <- shob feature merge
feature/*   <- ekta kaj = ekta branch
```
```bash
git branch                                   # branch list
git log --oneline --graph --all              # merge-er chhobi
git checkout develop
git checkout -b feature/amar-kaj
git add . && git commit -m "feat: amar kaj"
git checkout develop && git merge --no-ff feature/amar-kaj
```
**`.env` kokhono commit korben na** (`.gitignore`-e ache). GitHub-e dile shudhu `.env.example` jabe.

---

## 11. Pore real AI lagle
`src/services/ai.ts` e function-gulo ekhon rule diye ans. Real AI (Claude/OpenAI) dite chaile oi function-er bhitore API call korun (API key `.env`-e rakhun, kokhono frontend-e na). Route ar frontend change lagbe na, karon return format ek-i thakbe.

## 12. Production-e dilei age
- `JWT_SECRET` onek lomba random korun
- `CLIENT_URL`-e asol website address din
- `npm run build` -> `npm start`
- Database password shobol rakhun
