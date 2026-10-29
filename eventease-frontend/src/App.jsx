import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Auth } from './api/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Guests from './pages/Guests';
import Tasks from './pages/Tasks';
import Schedule from './pages/Schedule';
import Budget from './pages/Budget';
import Expenses from './pages/Expenses';
import AiPlanner from './pages/AiPlanner';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import GuestPortal from './pages/GuestPortal';
import Discover from './pages/Discover';
import Requests from './pages/Requests';
import AdminDashboard from './pages/AdminDashboard';
import AdminRequests from './pages/AdminRequests';
import { AdminAdmins, AdminEvents, AdminUsers } from './pages/AdminLists';

// Protected route. role = 'admin' | 'organizer' (the normal user) | 'guest' | undefined (any logged-in user)
function RequireAuth({ role, children, login = '/login' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={login} replace />;
  if (role && user.role !== role) return <Navigate to={Auth.homePath(user)} replace />;
  return children;
}

// Login / register are for logged-out visitors only
function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={Auth.homePath(user)} replace /> : children;
}

// admin pages send logged-out visitors to the admin login, everything else to the normal login
function LayoutGate() {
  const admin = window.location.pathname.startsWith('/admin');
  return <RequireAuth login={admin ? '/admin/login' : '/login'}><Layout /></RequireAuth>;
}

const usr = el => <RequireAuth role="organizer">{el}</RequireAuth>;
const adm = el => <RequireAuth role="admin" login="/admin/login">{el}</RequireAuth>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/admin/login" element={<PublicOnly><AdminLogin /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route element={<LayoutGate />}>
        {/* user (organizer) */}
        <Route path="/dashboard" element={usr(<Dashboard />)} />
        <Route path="/discover" element={usr(<Discover />)} />
        <Route path="/requests" element={usr(<Requests />)} />
        <Route path="/events" element={usr(<Events />)} />
        <Route path="/events/:id" element={usr(<EventDetails />)} />
        <Route path="/guests" element={usr(<Guests />)} />
        <Route path="/tasks" element={usr(<Tasks />)} />
        <Route path="/schedule" element={usr(<Schedule />)} />
        <Route path="/budget" element={usr(<Budget />)} />
        <Route path="/expenses" element={usr(<Expenses />)} />
        <Route path="/ai-planner" element={usr(<AiPlanner />)} />
        <Route path="/notifications" element={usr(<Notifications />)} />
        {/* admin */}
        <Route path="/admin" element={adm(<AdminDashboard />)} />
        <Route path="/admin/requests" element={adm(<AdminRequests />)} />
        <Route path="/admin/events" element={adm(<AdminEvents />)} />
        <Route path="/admin/users" element={adm(<AdminUsers />)} />
        <Route path="/admin/admins" element={adm(<AdminAdmins />)} />
        {/* guest + everyone */}
        <Route path="/guest-portal" element={<RequireAuth role="guest"><GuestPortal /></RequireAuth>} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
