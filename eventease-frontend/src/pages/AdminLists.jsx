import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Img from '../components/Img';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import { Api } from '../api/api';
import { EVENT_TYPES } from '../config';
import { coverFor } from '../data/images';
import { useToast } from '../context/ToastContext';
import { daysUntil, fmtDate, fmtTime, money } from '../utils/format';

export function AdminUsers() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  useEffect(() => { Api.admin.users().then(setList).catch(err => { toast(err.message, 'error'); setList([]); }); }, [toast]);

  const shown = (list || []).filter(u => (!role || u.role === role) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="toolbar">
        <div className="search-box grow"><Icon name="search" /><input type="search" placeholder="Search name or email" aria-label="Search users" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select aria-label="Filter by role" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option><option value="organizer">Users</option><option value="guest">Guests</option><option value="admin">Admins</option>
        </select>
      </div>
      {list === null && <p className="muted">Loading...</p>}
      <div className="card rise table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Requests</th><th>Events</th><th>Joined</th></tr></thead>
          <tbody>
            {shown.map(u => (
              <tr key={u._id}>
                <td><span className="avatar sm">{u.name.charAt(0)}</span> <strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={'badge ' + (u.role === 'admin' ? 'high' : u.role === 'guest' ? 'info' : 'accepted')}>{u.role === 'organizer' ? 'user' : u.role}</span></td>
                <td>{u.requests}</td><td>{u.events}</td><td>{fmtDate(String(u.createdAt).slice(0, 10))}</td>
              </tr>
            ))}
            {list && shown.length === 0 && <tr><td colSpan="6" className="empty">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminEvents() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  useEffect(() => { Api.admin.events().then(setList).catch(err => { toast(err.message, 'error'); setList([]); }); }, [toast]);

  const shown = (list || []).filter(e => (!type || e.type === type) && (e.name + e.venue + e.owner?.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="toolbar">
        <div className="search-box grow"><Icon name="search" /><input type="search" placeholder="Search event, venue or owner" aria-label="Search events" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select aria-label="Filter by type" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All types</option>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      {list === null && <p className="muted">Loading...</p>}
      {list && shown.length === 0 && <p className="empty">No approved events yet.</p>}
      <div className="rows">
        {shown.map((e, i) => {
          const pct = e.stats.tasksTotal ? Math.round(e.stats.tasksDone / e.stats.tasksTotal * 100) : 0;
          const left = daysUntil(e.date);
          return (
            <article className="row-card rise" style={{ '--i': i }} key={e._id}>
              <div className="row-img"><Img src={coverFor(e.type)} type={e.type} alt="" /></div>
              <div className="row-main">
                <div className="row-tags"><span className="pill-tag">{e.type}</span></div>
                <h3>{e.name}</h3>
                <p className="row-desc"><span className="avatar sm">{e.owner?.name?.charAt(0)}</span>{e.owner?.name}</p>
              </div>
              <div className="row-mid">
                <span><Icon name="pin" />{e.venue}</span>
                <span><Icon name="events" />{fmtDate(e.date)} · {fmtTime(e.time)}</span>
              </div>
              <div className="row-prog">
                <ProgressBar pct={pct} extra="pink" /><span><b>{pct}%</b> tasks done</span>
              </div>
              <div className="row-end">
                <div className="seats"><strong>{e.guests}</strong><small>{left >= 0 ? left + ' days left' : 'finished'}</small></div>
                <div className="price-box"><strong>{money(e.budget)}</strong></div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function AdminAdmins() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Api.admin.admins().then(setList).catch(err => { toast(err.message, 'error'); setList([]); });
  useEffect(() => { load(); }, []); // eslint-disable-line
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault(); setError('');
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email are required');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      await Api.admin.addAdmin({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast('Admin added'); setOpen(false); setForm({ name: '', email: '', password: '' }); load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <>
      <div className="toolbar">
        <p className="muted grow">People who can review requests and manage the platform.</p>
        <button className="btn" onClick={() => { setError(''); setOpen(true); }}>+ Add admin</button>
      </div>
      {list === null && <p className="muted">Loading...</p>}
      <div className="card rise table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Added</th></tr></thead>
          <tbody>
            {(list || []).map(a => (
              <tr key={a._id}><td><span className="avatar sm">{a.name.charAt(0)}</span> <strong>{a.name}</strong></td><td>{a.email}</td><td>{fmtDate(String(a.createdAt).slice(0, 10))}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a new admin">
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="ad-name">Full name</label><input id="ad-name" name="name" value={form.name} onChange={set} required /></div>
          <div className="field"><label htmlFor="ad-email">Email</label><input id="ad-email" name="email" type="email" value={form.email} onChange={set} required /></div>
          <div className="field"><label htmlFor="ad-pass">Temporary password</label><input id="ad-pass" name="password" type="text" autoComplete="off" value={form.password} onChange={set} required />
            <span className="hint">At least 8 characters. Share it privately; they can change it in Settings.</span></div>
          <p className="error-text" role="alert">{error}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Adding...' : 'Add admin'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
