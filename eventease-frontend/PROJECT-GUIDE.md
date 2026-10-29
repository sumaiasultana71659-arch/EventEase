# EventEase – Project Guide (Banglish)

Ei file-e pura project ta page by page bujhano ache. Age "ki ki ache", tarpor "kon file ki kaj kore".

## 1. Kemne chalabo
```bash
npm install
npm run dev        # browser-e http://localhost:5173 khulbe
```
Backend lagbe na. `src/config.js`-e `USE_MOCK: true` thakle data browser-er localStorage-e thake.
Data reset korte: browser DevTools -> Application -> Local Storage -> Clear.

## 2. "Fill organizer" / "Fill guest" button ta ki?
Login page-e (`src/pages/Login.jsx`) duita button ache. Click korle shudhu email + password input-e boshiye dey,
tarpor tumi nijei "Log in" chapo.

```jsx
const DEMO = {
  organizer: { email: 'organizer@eventease.com', password: 'demo123' },
  guest:     { email: 'guest@eventease.com',     password: 'demo123' }
};
<button onClick={() => setForm(DEMO.organizer)}>Fill organizer</button>
```

Ei duita account **kothay toiri hoy?** `src/api/api.js` er `MockDB.seed()` function-e. Prothombar app khulle
ei function ekta fake database banay (users, events, guests, tasks, activities, expenses) ar localStorage-e rakhe.
Tai ei account-gulo asole real server-e nai, browser-er bhitore fake. Real backend (Spring Boot) connect korle
ei button-gulo muche dite paro.

Organizer account dile sidebar-e dashboard, events, guests... shob dekhabe. Guest account dile shudhu "My invitations" page.

## 3. Folder structure
```
src/
  main.jsx            app start, Router + Provider-gulo ekhane
  App.jsx             shob route (URL -> page) + login guard
  config.js           USE_MOCK, API_URL, currency, event types, categories
  hooks.js            useCollection(eventId, 'guests') - list load korar hook
  api/
    api.js            Api.login(), Api.list() ... + MockDB (fake backend)
    aiMock.js         fake AI (rule-based) - 5 ta AI feature
    auth.js           token/user localStorage-e save
  context/            global state
    AuthContext       logged in user, login/register/logout
    EventContext      organizer-er event list + "current event"
    ToastContext      chhoto notification (Saved, Deleted ...)
  components/         bar bar use hoy emon UI
    Layout            sidebar + topbar + page content
    Modal, ProgressBar, CountUp, EmptyState, Icon
    Illustrations     SVG chobi (event cover, hero art)
  pages/              ekta page = ekta file
  utils/              format.js (date/money), notifications.js
  styles/style.css    shob CSS + animation
```

## 4. Data kemne ghore (flow)
`Page` -> `Api.xxx()` -> (`USE_MOCK` true hole) `MockDB` / (false hole) Spring Boot -> data fire ashe -> page `useState`-e rakhe -> screen-e dekhay.

*Current event*: organizer-er onek event thakte pare. Topbar-er dropdown theke ekta select korle (`EventContext.current`)
Dashboard, Guests, Tasks, Schedule, Budget, Expenses, AI Planner shob sei event-er data dekhay.

## 5. Page by page

| URL | File | Ke dekhe | Ki kore |
|---|---|---|---|
| `/` | Landing.jsx | sobai | Introduction, feature card, "Get started" |
| `/login` | Login.jsx | sobai | Email/password login, Fill organizer/guest |
| `/register` | Register.jsx | sobai | Notun account, role (Organizer/Guest) select |
| `/dashboard` | Dashboard.jsx | organizer | Event hero, 6 ta stat, budget donut, expense bar, pending task, AI summary |
| `/events` | Events.jsx | organizer | Event card grid, search/filter, create/edit/delete modal |
| `/events/:id` | EventDetails.jsx | organizer | Ekta event-er puro info, organizer, schedule timeline |
| `/guests` | Guests.jsx | organizer | Guest table, RSVP + attendance dropdown, add/edit/delete |
| `/tasks` | Tasks.jsx | organizer | Checklist, progress bar, tick korle done, priority/overdue badge |
| `/schedule` | Schedule.jsx | organizer | Calendar (mash), din select korle oi dine-r activity, add/edit/delete |
| `/budget` | Budget.jsx | organizer | Total budget + 5 category split, allocated/unallocated hisab, overview bar |
| `/expenses` | Expenses.jsx | organizer | Expense table, category filter, budget cross korle warning |
| `/ai-planner` | AiPlanner.jsx | organizer | 5 AI tool: suggestions, budget split, task generator, schedule, summary |
| `/notifications` | Notifications.jsx | organizer | Overdue task, RSVP baki, budget 90%+ - auto toiri reminder |
| `/guest-portal` | GuestPortal.jsx | guest | Nijer invitation, event info, schedule, Accept/Decline |
| `/settings` | Settings.jsx | duijon-i | Name, email, password change |

### Login guard (App.jsx)
- `RequireAuth` : login na thakle `/login`-e pathay. `role="organizer"` dile guest ke organizer page-e dhukte dey na.
- `PublicOnly` : already login thakle login/register page-e na diye nijer home-e pathay.

### Layout.jsx
Sidebar (role onujayi alada menu), topbar (page title, event dropdown, bell badge, user), ar `<Outlet />` jekhane
current page boshe. Organizer-er kono event na thakle shob page-er jaygay "No event yet" dekhay.

### Mock AI (aiMock.js)
Real AI na - rule diye toiri. Input: event type, guest, date, budget. Output: suggestion, budget % split, task list, timeline, summary.
Real AI lagale Spring Boot backend theke OpenAI/Claude call kore same format-e data pathabe (README-te endpoint list ache).

## 6. Chobi ar animation
Chobi gulo **SVG illustration**, `src/components/Illustrations.jsx`-e. Internet/image file lage na.
- `EventCover` : event type onujayi alada rong + chobi (Wedding = ring, Birthday = cake + balloon, Corporate = building, Conference = screen + mic, Concert = stage, Other = star).
- `HeroArt` : landing + login/register side-er boro chobi.
- `EmptyArt` : "kichu nai" state-er chobi.

Nijer photo dite chaile `public/images/` folder-e rakho ar `EventCover`-er jaygay `<img src="/images/x.jpg" />` boshao.

Animation (shob `src/styles/style.css`-er shesh-e):
- `.rise` : card gulo niche theke upore fade-in hoy, ekta ekta kore (`--i` delay)
- `.lift` : mouse nile card uthe jay
- Donut chart ghure bhore, progress bar bere ghorhe, number 0 theke gune (`CountUp.jsx`)
- Modal pop, toast slide, ballon/star float, landing blob bhashe, AI button-e shimmer
- Jar computer-e "reduce motion" on, tar jonno shob animation bondho.

## 7. Spring Boot connect korbe kemne
1. `src/config.js`: `USE_MOCK: false`, `API_URL: 'http://localhost:8080/api'`
2. Spring Boot-e CORS on (`http://localhost:5173` allow)
3. README-r endpoint table onujayi API baniye nao. Page-er code change lagbe na - shob request `src/api/api.js` diye jay.

## 8. Git branching
```
main        <- stable / release (v1-vanilla, v2.0.0-react tag)
develop     <- shob feature ekhane merge hoy
feature/*   <- ekta kaj = ekta branch
```
Notun kaj:
```bash
git checkout develop
git checkout -b feature/my-new-thing
# code ... 
git add . && git commit -m "feat: add my new thing"
git checkout develop && git merge --no-ff feature/my-new-thing
```
Release: `git checkout main && git merge --no-ff develop && git tag v2.1.0`

Commit message niyom: `feat:` notun jinish, `fix:` bug, `style:` CSS, `docs:` lekha, `refactor:` code gochano.
Ager (plain HTML) version `git checkout v1-vanilla` diye dekha jabe.
