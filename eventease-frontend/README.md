# EventEase – AI-Powered Event Management & Planning Platform (React frontend)

React 18 + Vite + React Router. UI follows the Ventixe dashboard layout (sidebar, top bar, stat cards, tables)
with a colourful theme, SVG illustrations and CSS animations.

> The earlier plain HTML/CSS/JS version is kept in git history: `git checkout v1-vanilla`.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```
Demo accounts (buttons on the login page fill them in):
- Organizer: `organizer@eventease.com` / `demo123`
- Guest: `guest@eventease.com` / `demo123`

`src/config.js` has `USE_MOCK: true`, so everything works with no backend
(data lives in browser localStorage; clear site data to reset the demo).

## Pages
| Role | Route | Feature |
|---|---|---|
| Public | `/` | Landing page |
| Public | `/login`, `/register` | Authentication, role selection |
| Organizer | `/dashboard` | Event dashboard, financial overview, AI summary |
| Organizer | `/events`, `/events/:id` | Event creation/management, details |
| Organizer | `/guests` | Guest management, RSVP and attendance |
| Organizer | `/tasks` | Task and checklist management |
| Organizer | `/schedule` | Schedule and calendar |
| Organizer | `/budget`, `/expenses` | Budget split, expense tracking |
| Organizer | `/ai-planner` | Suggestions, budget split, task generator, timeline, summary |
| Organizer | `/notifications` | Reminders |
| Guest | `/guest-portal` | View event/schedule, accept or decline |
| Both | `/settings` | Profile and password |

A page-by-page explanation (in Banglish) is in **PROJECT-GUIDE.md**.

## Connect Spring Boot + MySQL
1. In `src/config.js` set `USE_MOCK: false` and `API_URL` (e.g. `http://localhost:8080/api`).
2. Enable CORS in Spring Boot for `http://localhost:5173`.
3. Build these endpoints. Protected ones read `Authorization: Bearer <JWT>`.

| Method | Path | Notes |
|---|---|---|
| POST | /auth/register | {name,email,password,role: organizer or guest} -> {token,user} |
| POST | /auth/login | {email,password} -> {token,user:{_id,name,email,role}} |
| GET, PUT | /auth/me | current user |
| GET, POST | /events | organizer's events / create |
| GET, PUT, DELETE | /events/{id} | name,type,date,time,venue,guests,budget,description,organizerName,organizerPhone,allocation{venue,food,decoration,transportation,misc} |
| GET, POST | /events/{id}/guests | name,email,phone,rsvp(pending/accepted/declined),attendance(pending/present/absent) |
| GET, POST | /events/{id}/tasks | title,deadline,done,priority(low/medium/high) |
| GET, POST | /events/{id}/activities | title,date,time,notes |
| GET, POST | /events/{id}/expenses | title,category,amount,date |
| PUT, DELETE | /guests/{id}, /tasks/{id}, /activities/{id}, /expenses/{id} | update / delete |
| GET | /my-invitations | guest role: [{guest,event,activities}] matched by login email |
| PUT | /my-invitations/{guestId}/rsvp | {rsvp} |
| POST | /ai/plan, /ai/budget, /ai/tasks, /ai/schedule | see `src/api/aiMock.js` for input/output shapes |
| GET | /events/{id}/ai-summary | -> {summary: string[]} |

Use `_id` as the JSON id field name (or change it in the code).

## Git workflow
`main` (stable) <- `develop` <- `feature/*`. See PROJECT-GUIDE.md section 8.
