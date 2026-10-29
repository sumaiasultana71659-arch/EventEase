import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import EmptyState from './EmptyState';
import UserHome from '../pages/UserHome';
import { Api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { buildNotifications } from '../utils/notifications';

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Dashboard', ico: 'dashboard' },
  { to: '/admin/requests', label: 'Requests', ico: 'inbox', badge: true },
  { to: '/admin/events', label: 'Events', ico: 'events' },
  { to: '/admin/users', label: 'Users', ico: 'guests' },
  { to: '/admin/admins', label: 'Admins', ico: 'user' },
  { to: '/settings', label: 'Settings', ico: 'settings' }
];
const USER_NAV = [
  { group: 'Overview' },
  { to: '/dashboard', label: 'Dashboard', ico: 'dashboard' },
  { to: '/discover', label: 'Event ideas', ico: 'ai' },
  { to: '/requests', label: 'My requests', ico: 'inbox' },
  { group: 'My event' },
  { to: '/events', label: 'Events', ico: 'events' },
  { to: '/guests', label: 'Guests', ico: 'guests' },
  { to: '/tasks', label: 'Tasks', ico: 'tasks' },
  { to: '/schedule', label: 'Schedule', ico: 'schedule' },
  { to: '/budget', label: 'Budget', ico: 'budget' },
  { to: '/expenses', label: 'Expenses', ico: 'expenses' },
  { group: 'Assistant' },
  { to: '/ai-planner', label: 'AI Planner', ico: 'ai' },
  { to: '/notifications', label: 'Notifications', ico: 'bell' },
  { to: '/settings', label: 'Settings', ico: 'settings' }
];
const GUEST_NAV = [
  { to: '/guest-portal', label: 'My invitations', ico: 'mail' },
  { to: '/settings', label: 'Settings', ico: 'settings' }
];

// page title + whether the page needs a selected event (user role only)
function pageInfo(path) {
  if (path.startsWith('/events/')) return { title: 'Event details', needsEvent: true };
  const map = {
    '/dashboard': ['Dashboard', true], '/events': ['Events', false], '/guests': ['Guests', true],
    '/tasks': ['Tasks & checklist', true], '/schedule': ['Schedule & calendar', true], '/budget': ['Budget', true],
    '/expenses': ['Expenses', true], '/ai-planner': ['AI planner', true], '/notifications': ['Notifications', true],
    '/settings': ['Settings', false], '/guest-portal': ['My invitations', false],
    '/discover': ['Event ideas', false], '/requests': ['My requests', false],
    '/admin': ['Admin dashboard', false], '/admin/requests': ['Event requests', false],
    '/admin/events': ['All events', false], '/admin/users': ['Users', false], '/admin/admins': ['Admins', false]
  };
  const [title, needsEvent] = map[path] || ['EventEase', false];
  return { title, needsEvent };
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { events, current, loading, setCurrent } = useEvents();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bell, setBell] = useState(0);

  const isAdmin = user.role === 'admin';
  const isUser = user.role === 'organizer';
  const nav = isAdmin ? ADMIN_NAV : isUser ? USER_NAV : GUEST_NAV;
  const { title, needsEvent } = pageInfo(pathname);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // bell badge: admin = requests waiting for a decision, user = reminders of the current event
  useEffect(() => {
    let off = false;
    if (isAdmin) {
      Api.admin.requests('pending').then(l => { if (!off) setBell(l.length); }).catch(() => {});
    } else if (isUser && current) {
      buildNotifications(current).then(l => { if (!off) setBell(l.length); }).catch(() => {});
    } else setBell(0);
    return () => { off = true; };
  }, [isAdmin, isUser, current, pathname]);

  let body;
  if (isUser && needsEvent && loading) body = <p className="muted">Loading...</p>;
  else if (isUser && needsEvent && !current && pathname === '/dashboard') body = <UserHome />;
  else if (isUser && needsEvent && !current)
    body = <EmptyState title="No event yet" text="Request an event first. Once our team confirms it, you can manage guests, tasks, schedule and budget here." to="/discover" label="See event ideas" />;
  else body = <Outlet />;

  const bellTo = isAdmin ? '/admin/requests' : '/notifications';

  return (
    <div className="shell">
      <aside className={'sidebar' + (menuOpen ? ' open' : '')}>
        <Link to="/" className="brand"><span className="brand-logo">E</span>EventEase</Link>
        <nav className="nav">
          {nav.map((n, i) => n.group
            ? <div className="group" key={i}>{n.group}</div>
            : <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <span className="nav-ico"><Icon name={n.ico} /></span>{n.label}
                {n.badge && bell > 0 && <em className="nav-badge">{bell}</em>}
              </NavLink>)}
        </nav>

        <div className="sidebar-foot">
          {isUser && (
            <div className="promo">
              <div className="promo-art"><Icon name="ai" /></div>
              <p>Share your budget and taste. We will suggest events that fit.</p>
              <Link className="btn btn-ai btn-block" to="/discover">See event ideas</Link>
            </div>
          )}
          {isAdmin && (
            <div className="promo">
              <div className="promo-art"><Icon name="inbox" /></div>
              <p>{bell > 0 ? `${bell} request${bell > 1 ? 's' : ''} waiting for your decision.` : 'No requests waiting. Nice and clear.'}</p>
              <Link className="btn btn-ai btn-block" to="/admin/requests">Review requests</Link>
            </div>
          )}
          <button className="signout" onClick={() => { logout(); navigate(isAdmin ? '/admin/login' : '/'); }}><Icon name="logout" />Sign out</button>
        </div>
      </aside>
      <div className={'overlay' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Icon name="menu" /></button>
          <div className="crumb">
            <small>{isAdmin ? 'Admin' : isUser ? 'Workspace' : 'Guest'} / {title}</small>
            <h1>{title}</h1>
          </div>
          {isUser && needsEvent && events.length > 0 && (
            <select className="event-switch" aria-label="Current event" value={current?._id || ''} onChange={e => setCurrent(e.target.value)}>
              {events.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          )}
          {!user.role.includes('guest') && (
            <Link className="round-btn bell" to={bellTo} aria-label="Notifications">
              <Icon name="bell" />
              {bell > 0 && <b>{bell}</b>}
            </Link>
          )}
          <Link className="round-btn" to="/settings" aria-label="Settings"><Icon name="settings" /></Link>
          <div className="user-chip">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div><strong>{user.name}</strong><small>{isAdmin ? 'Admin' : isUser ? 'User' : 'Guest'}</small></div>
          </div>
        </header>
        <main className="content page-enter" key={pathname}>{body}</main>
      </div>
    </div>
  );
}
