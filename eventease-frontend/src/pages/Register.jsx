import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth } from '../context/AuthContext';
import { Auth } from '../api/auth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'organizer', name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      navigate(Auth.homePath(user), { replace: true });
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <AuthShell heading="Set up your event workspace in a minute."
      text="Join as a User to get event ideas and plan approved events, or as a Guest to answer invitations. ">
      <h2>Create your account</h2>
      <p>Pick how you will use EventEase.</p>
      <form onSubmit={submit} noValidate>
        <div className="field"><div className="role-pick">
          <label><input type="radio" name="role" value="organizer" checked={form.role === 'organizer'} onChange={set} /> User (plan events)</label>
          <label><input type="radio" name="role" value="guest" checked={form.role === 'guest'} onChange={set} /> Guest</label>
        </div></div>
        <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" value={form.name} onChange={set} /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={set} /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="new-password" value={form.password} onChange={set} /></div>
        <div className="field"><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" required autoComplete="new-password" value={form.confirm} onChange={set} /></div>
        <p className="error-text" role="alert">{error}</p>
        <button className="btn btn-block" type="submit" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="auth-alt">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
