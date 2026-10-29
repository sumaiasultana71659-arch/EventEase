# EventEase – Team Git Workflow (3 members)

Repository: https://github.com/sumaiasultana71659-arch/EventEase.git
Ei repo-te duto folder ache: `eventease-backend` ar `eventease-frontend`.

## Branch
```
main       <- final, sothik version (shudhu release-er shomoy)
develop    <- shobar kaj ekhane mile (Pull Request diye)
feature/member1-auth-planning   <- Member 1
feature/member2-admin           <- Member 2
feature/member3-user-ai-finance <- Member 3
```
Nijer branch-e checkout kore kaj shuru korun.

## Kaj-er bhag (file onujayi)

| Member | Frontend (eventease-frontend/src/) | Backend (eventease-backend/) |
|---|---|---|
| 1: Auth + Planning | pages/Landing, Login, Register, AdminLogin, AuthShell, Settings, Dashboard, Guests, Tasks, GuestPortal, components/Layout, context/AuthContext | src/routes/auth.ts, resources.ts, invitations.ts, src/middleware/, src/config.ts |
| 2: Admin | pages/AdminDashboard, AdminRequests, AdminLists, Events, EventDetails | src/routes/admin.ts, events.ts, src/utils/requests.ts, prisma/schema.prisma, prisma/seed.ts, src/app.ts |
| 3: User flow + AI + Finance | pages/UserHome, Discover, Requests, AiPlanner, Schedule, Budget, Expenses, Notifications, components/RequestModal, SuggestionCard | src/routes/requests.ts, ai.ts, src/services/ai.ts |

Shobai chhuy emon file-er malik:
- `styles/v3.css`, `styles/v4.css`, `App.jsx` -> Member 1
- `prisma/schema.prisma`, `src/app.ts` -> Member 2

Onno keu ei file-e kichu lagle malik-ke bolbe, ba khub chhoto change kore alada PR dibe.

## Rozkar kaj-er niyom
1. `git checkout develop` ar `git pull origin develop` (notun kaj shuru korar age)
2. `git checkout feature/<nijer-branch>` ar `git merge develop`
3. Kaj, tarpor `git add .` ar `git commit -m "feat: ..."`
4. `git push origin feature/<nijer-branch>`
5. GitHub-e **Pull Request**: base `develop` <- compare `feature/...`. Onno member review kore **Merge**.

Commit message: `feat:` notun jinish, `fix:` bug, `style:` CSS, `docs:` lekha, `refactor:` gochano.
`.env` kokhono commit korben na.
