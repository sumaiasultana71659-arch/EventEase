import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Img from '../components/Img';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import { Api } from '../api/api';
import { EVENT_TYPES } from '../config';
import { coverFor } from '../data/images';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { daysUntil, fmtDate, fmtTime, money } from '../utils/format';

const TABS = [['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']];

// Events are created by an admin when a request is approved, so users edit or delete here but "request" new ones.
export default function Events() {
  const { events, current, refresh, setCurrent } = useEvents();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [editing, setEditing] = useState(null);   // event being edited
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const isPast = e => daysUntil(e.date) < 0;
  const count = k => events.filter(e => k === 'all' || (k === 'past') === isPast(e)).length;
  const list = events.filter(e =>
    (tab === 'all' || (tab === 'past') === isPast(e)) && (!type || e.type === type) &&
    (e.name + e.venue).toLowerCase().includes(q.toLowerCase()));

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const data = { ...form, guests: Number(form.guests), budget: Number(form.budget) };
    if (!data.name.trim() || !data.venue.trim()) return setError('Name and venue are required');
    if (!(data.guests >= 1) || !(data.budget >= 0)) return setError('Guests and budget must be valid numbers');
    try { await Api.updateEvent(editing._id, data); toast('Event updated'); setEditing(null); await refresh(); }
    catch (err) { setError(err.message); }
  }
  async function confirmDelete() {
    try { await Api.deleteEvent(deleting._id); toast('Event deleted'); setDeleting(null); await refresh(); }
    catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="toolbar">
        <div className="tabs">
          {TABS.map(([k, l]) => <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}<em>{count(k)}</em></button>)}
        </div>
        <div className="search-box grow"><Icon name="search" /><input type="search" placeholder="Search event or venue" aria-label="Search events" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select aria-label="Filter by type" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All types</option>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <Link className="btn" to="/requests?new=1">+ Request event</Link>
      </div>

      {list.length === 0 && <p className="empty">No events here. Request one and our team will set it up.</p>}
      <div className="rows">
        {list.map((e, i) => {
          const st = e.stats || { tasksDone: 0, tasksTotal: 0 };
          const pct = st.tasksTotal ? Math.round(st.tasksDone / st.tasksTotal * 100) : 0;
          const left = daysUntil(e.date);
          return (
            <article className="row-card rise" style={{ '--i': i }} key={e._id}>
              <div className="row-img"><Img src={coverFor(e.type)} type={e.type} alt="" />{current && e._id === current._id && <span className="cur-tag">Current</span>}</div>
              <div className="row-main">
                <div className="row-tags"><span className="pill-tag">{e.type}</span></div>
                <h3>{e.name}</h3>
                <p className="row-desc">{e.description || 'No description yet.'}</p>
              </div>
              <div className="row-mid">
                <span><Icon name="pin" />{e.venue}</span>
                <span><Icon name="events" />{fmtDate(e.date)} · {fmtTime(e.time)}</span>
              </div>
              <div className="row-prog">
                <ProgressBar pct={pct} extra="pink" /><span><b>{pct}%</b> planning done</span>
              </div>
              <div className="row-end">
                <div className="seats"><strong>{e.guests}</strong><small>{left >= 0 ? left + ' days left' : 'finished'}</small></div>
                <div className="price-box"><strong>{money(e.budget)}</strong></div>
                <div className="actions">
                  <Link className="btn btn-sm" to={'/events/' + e._id} onClick={() => setCurrent(e._id)}>Details</Link>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setError(''); setForm({ ...e }); setEditing(e); }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleting(e)}>Delete</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit event">
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="name">Event name</label><input id="name" name="name" value={form.name || ''} onChange={set} required /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="type">Event type</label>
              <select id="type" name="type" value={form.type || ''} onChange={set}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label htmlFor="guests">Expected guests</label><input id="guests" name="guests" type="number" min="1" value={form.guests || ''} onChange={set} required /></div>
          </div>
          <div className="field-row">
            <div className="field"><label htmlFor="date">Date</label><input id="date" name="date" type="date" value={form.date || ''} onChange={set} required /></div>
            <div className="field"><label htmlFor="time">Time</label><input id="time" name="time" type="time" value={form.time || ''} onChange={set} required /></div>
          </div>
          <div className="field"><label htmlFor="venue">Venue</label><input id="venue" name="venue" value={form.venue || ''} onChange={set} required /></div>
          <div className="field"><label htmlFor="budget">Total budget</label><input id="budget" name="budget" type="number" min="0" value={form.budget ?? ''} onChange={set} required /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="organizerName">Organizer name</label><input id="organizerName" name="organizerName" value={form.organizerName || ''} onChange={set} /></div>
            <div className="field"><label htmlFor="organizerPhone">Organizer phone</label><input id="organizerPhone" name="organizerPhone" value={form.organizerPhone || ''} onChange={set} /></div>
          </div>
          <div className="field"><label htmlFor="description">Description</label><textarea id="description" name="description" rows="3" value={form.description || ''} onChange={set} /></div>
          <p className="error-text" role="alert">{error}</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn">Save event</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete event?" narrow>
        <p>"{deleting?.name}" and all its guests, tasks, schedule and expenses will be removed.</p>
        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete event</button>
        </div>
      </Modal>
    </>
  );
}
