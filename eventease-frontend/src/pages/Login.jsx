import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth } from '../context/AuthContext';
import { Auth } from '../api/auth';

// Demo accounts exist in the mock database (see src/api/api.js -> MockDB.seed)
const DEMO = {
  organizer: { email: 'organizer@eventease.com', password: 'demo123' },
  guest: { email: 'guest@eventease.com', password: 'demo123' }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const user = await login(form);
      navigate(Auth.homePath(user), { replace: true });
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <AuthShell heading="Welcome back."
      text="Pick up where you left off: your ideas, your guests and your plan are waiting.">
      <h2>Welcome back</h2>
      <p>Log in to continue.</p>
      <form onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={set} /></div>
        <div className="field"><label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" value={form.password} onChange={set} /></div>
        <p className="error-text" role="alert">{error}</p>
        <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="auth-alt">New here? <Link to="/register">Create an account</Link></p>
      <div className="demo">Demo accounts (after <code>npm run db:seed</code>):<br />
        <button type="button" className="btn btn-ghost btn-sm" style={{ margin: '6px 6px 0 0' }} onClick={() => setForm(DEMO.organizer)}>Fill user account</button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => setForm(DEMO.guest)}>Fill guest account</button>
      </div>
    </AuthShell>
  );
}
