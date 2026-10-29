// ====== API layer ======
// Pages only call Api.xxx(). CONFIG.USE_MOCK=true -> fake backend in localStorage.
// CONFIG.USE_MOCK=false -> Spring Boot REST API (JWT in Authorization header).
//
// REST contract:
//  POST /auth/register {name,email,password,role}  POST /auth/login {email,password}  GET|PUT /auth/me
//  GET|POST /events    GET|PUT|DELETE /events/:id
//  GET|POST /events/:id/(guests|tasks|activities|expenses)
//  PUT|DELETE /(guests|tasks|activities|expenses)/:id
//  GET /my-invitations   PUT /my-invitations/:guestId/rsvp {rsvp}        (guest role)
//  POST /ai/plan|budget|tasks|schedule|suggestions   GET /events/:id/ai-summary
//  GET|POST /requests  DELETE /requests/:id                                (user -> admin event requests)
//  GET /admin/stats|requests|users|events   PUT /admin/requests/:id/approve|reject   (admin)

import { CONFIG } from '../config';
import { Auth } from './auth';
import { AIMock } from './aiMock';

// Called when the real backend says 401 (set by AuthContext)
let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function realRequest(path, method = 'GET', body) {
  const token = Auth.getToken();
  const res = await fetch(CONFIG.API_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

/* ---------------- Mock backend ---------------- */
const MockDB = {
  KEY: 'eventease_db',
  load() {
    let db = JSON.parse(localStorage.getItem(this.KEY) || 'null');
    if (!db) { db = this.seed(); this.save(db); }
    return db;
  },
  save(db) { localStorage.setItem(this.KEY, JSON.stringify(db)); },
  id() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); },
  day(offset) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  seed() {
    const id = () => this.id(), day = o => this.day(o);
    const org = { _id: id(), name: 'Demo Organizer', email: 'organizer@eventease.com', password: 'demo123', role: 'organizer' };
    const gst = { _id: id(), name: 'Demo Guest', email: 'guest@eventease.com', password: 'demo123', role: 'guest' };
    const e1 = {
      _id: id(), ownerId: org._id, name: 'Annual Company Dinner', type: 'Corporate', date: day(24), time: '19:00',
      venue: 'Grand Hall, City Center', guests: 120, budget: 8000,
      description: 'Yearly dinner to celebrate team achievements, with awards and live music.',
      organizerName: 'Demo Organizer', organizerPhone: '+880 1700 000000',
      allocation: { venue: 2800, food: 2200, decoration: 800, transportation: 600, misc: 1600 }
    };
    const e2 = {
      _id: id(), ownerId: org._id, name: 'Product Launch Meetup', type: 'Conference', date: day(50), time: '10:00',
      venue: 'Tech Hub Auditorium', guests: 80, budget: 5000, description: 'Launch event with demos and networking.',
      organizerName: 'Demo Organizer', organizerPhone: '+880 1700 000000',
      allocation: { venue: 0, food: 0, decoration: 0, transportation: 0, misc: 0 }
    };
    const G = (name, email, rsvp, attendance = 'pending') => ({ _id: id(), eventId: e1._id, name, email, phone: '', rsvp, attendance });
    const guests = [
      G('Demo Guest', 'guest@eventease.com', 'pending'), G('Rafi Ahmed', 'rafi@mail.com', 'accepted'),
      G('Nusrat Jahan', 'nusrat@mail.com', 'accepted'), G('Tanvir Hasan', 'tanvir@mail.com', 'declined'),
      G('Mim Akter', 'mim@mail.com', 'pending'), G('Sabbir Khan', 'sabbir@mail.com', 'accepted'),
      G('Farzana Islam', 'farzana@mail.com', 'accepted'), G('Imran Hossain', 'imran@mail.com', 'pending')
    ];
    const T = (title, deadline, done, priority) => ({ _id: id(), eventId: e1._id, title, deadline, done, priority });
    const tasks = [
      T('Confirm venue booking', day(-3), true, 'high'), T('Finalise the guest list', day(2), false, 'high'),
      T('Send invitations', day(5), false, 'high'), T('Confirm catering menu', day(9), false, 'medium'),
      T('Arrange transportation', day(14), false, 'medium'), T('Prepare agenda and speaker list', day(-1), false, 'medium'),
      T('Do a final venue walkthrough', day(23), false, 'low')
    ];
    const A = (title, date, time, notes) => ({ _id: id(), eventId: e1._id, title, date, time, notes });
    const activities = [
      A('Catering tasting', day(2), '15:00', 'At the caterer office'), A('Decoration vendor meeting', day(6), '11:00', ''),
      A('RSVP deadline', day(14), '23:00', ''), A('Rehearsal', day(23), '17:00', 'Check AV and stage'),
      A('Dinner starts', day(24), '19:00', 'Welcome drinks at 18:30')
    ];
    const X = (title, category, amount, date) => ({ _id: id(), eventId: e1._id, title, category, amount, date });
    const expenses = [
      X('Venue deposit', 'venue', 1500, day(-10)), X('Catering advance', 'food', 1200, day(-6)),
      X('Stage and lighting', 'decoration', 450, day(-4)), X('Shuttle bus booking', 'transportation', 300, day(-2)),
      X('Printing and invitations', 'misc', 220, day(-1))
    ];
    return { users: [org, gst], events: [e1, e2], guests, tasks, activities, expenses };
  }
};

const delay = v => new Promise(r => setTimeout(() => r(v), 120));
const fail = msg => Promise.reject(new Error(msg));
const pubUser = u => ({ _id: u._id, name: u.name, email: u.email, role: u.role });
const RELATED = ['guests', 'tasks', 'activities', 'expenses'];

function mockRequest(path, method = 'GET', body) {
  // Admin, requests and AI suggestions only exist in the real backend
  if (/^\/(admin|requests)/.test(path) || path === '/ai/suggestions')
    return fail('This feature needs the real backend. In src/config.js set USE_MOCK: false and start eventease-backend.');
  const db = MockDB.load();
  const token = Auth.getToken();
  const me = token ? db.users.find(u => 'mock-' + u._id === token) : null;

  if (path === '/auth/register' && method === 'POST') {
    const email = body.email.toLowerCase();
    if (db.users.some(u => u.email === email)) return fail('Email is already registered');
    const user = { _id: MockDB.id(), name: body.name, email, password: body.password, role: body.role === 'guest' ? 'guest' : 'organizer' };
    db.users.push(user); MockDB.save(db);
    return delay({ token: 'mock-' + user._id, user: pubUser(user) });
  }
  if (path === '/auth/admin-login') return fail('Admin login needs the real backend (USE_MOCK: false).');
  if (path === '/auth/login' && method === 'POST') {
    const user = db.users.find(u => u.email === body.email.toLowerCase() && u.password === body.password);
    if (!user) return fail('Invalid email or password');
    return delay({ token: 'mock-' + user._id, user: pubUser(user) });
  }
  if (!me) return fail('Please log in again');

  if (path === '/auth/me') {
    if (method === 'GET') return delay(pubUser(me));
    if (method === 'PUT') {
      if (body.name) me.name = body.name;
      if (body.email) me.email = body.email.toLowerCase();
      if (body.password) me.password = body.password;
      MockDB.save(db); return delay(pubUser(me));
    }
  }

  /* ----- Guest role ----- */
  if (path === '/my-invitations' && method === 'GET') {
    const mine = db.guests.filter(g => g.email === me.email);
    return delay(mine.map(g => ({
      guest: g, event: db.events.find(e => e._id === g.eventId),
      activities: db.activities.filter(a => a.eventId === g.eventId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    })).filter(x => x.event));
  }
  let m = path.match(/^\/my-invitations\/(\w+)\/rsvp$/);
  if (m && method === 'PUT') {
    const g = db.guests.find(x => x._id === m[1] && x.email === me.email);
    if (!g) return fail('Invitation not found');
    g.rsvp = body.rsvp; MockDB.save(db); return delay(g);
  }

  /* ----- AI ----- */
  m = path.match(/^\/ai\/(plan|budget|tasks|schedule)$/);
  if (m && method === 'POST') return AIMock[m[1]](body);
  m = path.match(/^\/events\/(\w+)\/ai-summary$/);
  if (m) {
    const event = db.events.find(e => e._id === m[1] && e.ownerId === me._id);
    if (!event) return fail('Event not found');
    const by = c => db[c].filter(x => x.eventId === event._id);
    return AIMock.summary({ event, guests: by('guests'), tasks: by('tasks'), expenses: by('expenses'), activities: by('activities') });
  }

  /* ----- Organizer: events ----- */
  if (me.role !== 'organizer') return fail('Only organizers can do this');
  const owned = id => db.events.find(e => e._id === id && e.ownerId === me._id);

  m = path.match(/^\/events(?:\/(\w+))?$/);
  if (m) {
    const id = m[1];
    if (!id && method === 'GET') return delay(db.events.filter(e => e.ownerId === me._id).sort((a, b) => a.date.localeCompare(b.date)));
    if (!id && method === 'POST') {
      const ev = { _id: MockDB.id(), ownerId: me._id, allocation: { venue: 0, food: 0, decoration: 0, transportation: 0, misc: 0 }, ...body };
      db.events.push(ev); MockDB.save(db); return delay(ev);
    }
    const ev = owned(id);
    if (!ev) return fail('Event not found');
    if (method === 'GET') return delay(ev);
    if (method === 'PUT') { Object.assign(ev, body); MockDB.save(db); return delay(ev); }
    if (method === 'DELETE') {
      db.events = db.events.filter(e => e._id !== id);
      RELATED.forEach(c => db[c] = db[c].filter(x => x.eventId !== id));
      MockDB.save(db); return delay({ message: 'Deleted' });
    }
  }

  /* ----- Organizer: nested resources ----- */
  m = path.match(/^\/events\/(\w+)\/(guests|tasks|activities|expenses)$/);
  if (m) {
    if (!owned(m[1])) return fail('Event not found');
    const col = m[2];
    if (method === 'GET') return delay(db[col].filter(x => x.eventId === m[1]));
    if (method === 'POST') { const item = { _id: MockDB.id(), eventId: m[1], ...body }; db[col].push(item); MockDB.save(db); return delay(item); }
  }
  m = path.match(/^\/(guests|tasks|activities|expenses)\/(\w+)$/);
  if (m) {
    const col = m[1], item = db[col].find(x => x._id === m[2]);
    if (!item || !owned(item.eventId)) return fail('Not found');
    if (method === 'PUT') { Object.assign(item, body); MockDB.save(db); return delay(item); }
    if (method === 'DELETE') { db[col] = db[col].filter(x => x._id !== m[2]); MockDB.save(db); return delay({ message: 'Deleted' }); }
  }
  return fail('Unknown endpoint ' + method + ' ' + path);
}

const request = (p, m, b) => CONFIG.USE_MOCK ? mockRequest(p, m, b) : realRequest(p, m, b);

export const Api = {
  register: d => request('/auth/register', 'POST', d),
  login: d => request('/auth/login', 'POST', d),
  adminLogin: d => request('/auth/admin-login', 'POST', d),
  me: () => request('/auth/me'),
  updateMe: d => request('/auth/me', 'PUT', d),

  getEvents: () => request('/events'),
  createEvent: d => request('/events', 'POST', d),
  updateEvent: (id, d) => request('/events/' + id, 'PUT', d),
  deleteEvent: id => request('/events/' + id, 'DELETE'),

  list: (eventId, col) => request(`/events/${eventId}/${col}`),            // col: guests|tasks|activities|expenses
  add: (eventId, col, d) => request(`/events/${eventId}/${col}`, 'POST', d),
  update: (col, id, d) => request(`/${col}/${id}`, 'PUT', d),
  remove: (col, id) => request(`/${col}/${id}`, 'DELETE'),

  invitations: () => request('/my-invitations'),
  rsvp: (guestId, rsvp) => request(`/my-invitations/${guestId}/rsvp`, 'PUT', { rsvp }),

  // user -> admin event requests
  myRequests: () => request('/requests'),
  createRequest: d => request('/requests', 'POST', d),
  cancelRequest: id => request('/requests/' + id, 'DELETE'),

  // admin only
  admin: {
    stats: () => request('/admin/stats'),
    requests: status => request('/admin/requests' + (status ? '?status=' + status : '')),
    approve: (id, d) => request(`/admin/requests/${id}/approve`, 'PUT', d),
    reject: (id, note) => request(`/admin/requests/${id}/reject`, 'PUT', { note }),
    users: () => request('/admin/users'),
    admins: () => request('/admin/admins'),
    addAdmin: d => request('/admin/admins', 'POST', d),
    events: () => request('/admin/events')
  },

  ai: {
    suggestions: d => request('/ai/suggestions', 'POST', d || {}),
    plan: d => request('/ai/plan', 'POST', d),
    budget: d => request('/ai/budget', 'POST', d),
    tasks: d => request('/ai/tasks', 'POST', d),
    schedule: d => request('/ai/schedule', 'POST', d),
    summary: eventId => request(`/events/${eventId}/ai-summary`)
  }
};
