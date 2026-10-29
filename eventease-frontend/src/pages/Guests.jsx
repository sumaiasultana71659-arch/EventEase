import { useState } from 'react';
import Modal from '../components/Modal';
import CountUp from '../components/CountUp';
import { Api } from '../api/api';
import { useCollection } from '../hooks';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';

const blank = { name: '', email: '', phone: '', rsvp: 'pending', attendance: 'pending' };

export default function Guests() {
  const { current: ev } = useEvents();
  const toast = useToast();
  const { items: guests, setItems, reload } = useCollection(ev._id, 'guests');
  const [q, setQ] = useState('');
  const [rsvp, setRsvp] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | guest id
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const count = r => guests.filter(g => g.rsvp === r).length;
  const list = guests.filter(g => (!rsvp || g.rsvp === rsvp) && (g.name + g.email).toLowerCase().includes(q.toLowerCase()));
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  function openForm(g) { setError(''); setForm(g ? { ...blank, ...g } : blank); setEditing(g ? g._id : 'new'); }

  async function save(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Guest name is required');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email (guests use it to log in)');
    try {
      const { name, email, phone, rsvp: r, attendance } = form;
      const data = { name, email, phone, rsvp: r, attendance };
      if (editing === 'new') await Api.add(ev._id, 'guests', data); else await Api.update('guests', editing, data);
      setEditing(null); toast(editing === 'new' ? 'Guest added' : 'Guest updated'); await reload();
    } catch (err) { setError(err.message); }
  }
  async function setField(id, field, value) {
    setItems(guests.map(g => (g._id === id ? { ...g, [field]: value } : g))); // optimistic
    try { await Api.update('guests', id, { [field]: value }); await reload(); } catch (err) { toast(err.message, 'error'); reload(); }
  }
  async function remove(id) {
    if (!window.confirm('Remove this guest?')) return;
    try { await Api.remove('guests', id); toast('Guest removed'); await reload(); } catch (err) { toast(err.message, 'error'); }
  }

  const chips = [
    ['On the list', guests.length, `of ${ev.guests} expected`, 'blue'], ['Accepted', count('accepted'), '', 'green'],
    ['Declined', count('declined'), '', 'red'], ['No reply', count('pending'), '', 'orange']
  ];

  return (
    <>
      <section className="grid stats">
        {chips.map(([label, n, sub, tone], i) => (
          <div className={'card stat rise lift stat-' + tone} style={{ '--i': i }} key={label}>
            <div><p>{label}</p><strong><CountUp value={n} /></strong>{sub && <small>{sub}</small>}</div>
          </div>
        ))}
      </section>
      <div className="toolbar">
        <input className="grow" type="search" placeholder="Search by name or email" aria-label="Search guests" value={q} onChange={e => setQ(e.target.value)} />
        <select aria-label="Filter by RSVP" value={rsvp} onChange={e => setRsvp(e.target.value)}>
          <option value="">All RSVP</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="pending">No reply</option>
        </select>
        <button className="btn" onClick={() => openForm(null)}>+ Add guest</button>
      </div>
      <div className="card rise" style={{ '--i': 4 }}><div className="table-wrap"><table>
        <thead><tr><th>Guest</th><th>RSVP</th><th>Attendance</th><th></th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan="4" className="empty">No guests found</td></tr>}
          {list.map(g => (
            <tr key={g._id}>
              <td><div className="who"><span className="avatar sm">{g.name.charAt(0).toUpperCase()}</span>
                <div><strong>{g.name}</strong><br /><small className="muted">{g.email}{g.phone ? ' · ' + g.phone : ''}</small></div></div></td>
              <td><select aria-label="RSVP" value={g.rsvp} onChange={e => setField(g._id, 'rsvp', e.target.value)}>
                {['pending', 'accepted', 'declined'].map(s => <option key={s} value={s}>{s}</option>)}</select></td>
              <td><select aria-label="Attendance" value={g.attendance} onChange={e => setField(g._id, 'attendance', e.target.value)}>
                {['pending', 'present', 'absent'].map(s => <option key={s} value={s}>{s}</option>)}</select></td>
              <td><div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openForm(g)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(g._id)}>Delete</button></div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add guest' : 'Edit guest'}>
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="g-name">Full name</label><input id="g-name" name="name" value={form.name} onChange={set} required /></div>
          <div className="field"><label htmlFor="g-email">Email</label><input id="g-email" name="email" type="email" value={form.email} onChange={set} required />
            <p className="hint">The guest logs in with this email to view the event and reply.</p></div>
          <div className="field"><label htmlFor="g-phone">Phone (optional)</label><input id="g-phone" name="phone" value={form.phone || ''} onChange={set} /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="g-rsvp">RSVP</label>
              <select id="g-rsvp" name="rsvp" value={form.rsvp} onChange={set}><option value="pending">No reply</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div>
            <div className="field"><label htmlFor="g-att">Attendance</label>
              <select id="g-att" name="attendance" value={form.attendance} onChange={set}><option value="pending">Not yet</option><option value="present">Present</option><option value="absent">Absent</option></select></div>
          </div>
          <p className="error-text" role="alert">{error}</p>
          <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="btn">Save guest</button></div>
        </form>
      </Modal>
    </>
  );
}
