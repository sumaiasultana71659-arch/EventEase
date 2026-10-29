import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Staff-only sign in. There is no link to it on the public pages; admins open /admin/login directly.
export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await adminLogin(form); navigate('/admin', { replace: true }); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="admin-login">
      <form className="admin-box page-enter" onSubmit={submit} noValidate>
        <div className="brand"><span className="brand-logo">E</span>EventEase</div>
        <h1>Staff sign in</h1>
        <p>This page is for EventEase administrators only.</p>
        <div className="field"><label htmlFor="a-email">Admin email</label>
          <input id="a-email" name="email" type="email" autoComplete="username" required value={form.email} onChange={set} /></div>
        <div className="field"><label htmlFor="a-pass">Password</label>
          <input id="a-pass" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={set} /></div>
        <p className="error-text" role="alert">{error}</p>
        <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        <Link className="back-link" to="/">Back to the website</Link>
      </form>
    </div>
  );
}
