import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '' });
  const [error, setError] = useState('');
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault(); setError('');
    const data = { name: form.name.trim(), email: form.email.trim() };
    if (!data.name || !data.email) return setError('Name and email are required');
    if (form.password) {
      if (form.password.length < 6) return setError('Password must be at least 6 characters');
      data.password = form.password;
    }
    try { await updateProfile(data); setForm(f => ({ ...f, password: '' })); toast('Profile saved'); }
    catch (err) { setError(err.message); }
  }

  return (
    <div className="card rise" style={{ maxWidth: 560 }}>
      <h2>Your profile</h2>
      <p className="hint" style={{ marginBottom: 14 }}>Role: <strong>{user.role === 'guest' ? 'Guest' : user.role === 'admin' ? 'Admin' : 'User'}</strong></p>
      <form onSubmit={save} noValidate>
        <div className="field"><label htmlFor="s-name">Full name</label><input id="s-name" name="name" value={form.name} onChange={set} required /></div>
        <div className="field"><label htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" value={form.email} onChange={set} required /></div>
        <div className="field"><label htmlFor="s-pass">New password (leave empty to keep current)</label>
          <input id="s-pass" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set} /></div>
        <p className="error-text" role="alert">{error}</p>
        <button className="btn" type="submit">Save changes</button>
      </form>
    </div>
  );
}
