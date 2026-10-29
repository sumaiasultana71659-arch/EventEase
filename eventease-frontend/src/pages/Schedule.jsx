import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { Api } from '../api/api';
import { useCollection } from '../hooks';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime, iso, today } from '../utils/format';

const monthOf = d => { const x = new Date(d + 'T00:00:00'); return new Date(x.getFullYear(), x.getMonth(), 1); };

export default function Schedule() {
  const { current: ev } = useEvents();
  const toast = useToast();
  const { items: acts, reload } = useCollection(ev._id, 'activities');
  const { items: tasks } = useCollection(ev._id, 'tasks');
  const [view, setView] = useState(() => monthOf(ev.date));
  const [selected, setSelected] = useState(iso(today()));
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', time: '10:00', notes: '' });
  const [error, setError] = useState('');

  // when the user switches event, jump the calendar to that event's month
  useEffect(() => { setView(monthOf(ev.date)); }, [ev._id, ev.date]);

  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1).getDay(), total = new Date(y, m + 1, 0).getDate();
  const todayIso = iso(today());
  const days = [];
  for (let d = 1; d <= total; d++) days.push(iso(new Date(y, m, d)));

  const dayActs = acts.filter(a => a.date === selected).sort((a, b) => a.time.localeCompare(b.time));
  const dayTasks = tasks.filter(t => t.deadline === selected && !t.done);
  const nothing = !(ev.date === selected || dayActs.length || dayTasks.length);
  const all = [...acts].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  function openForm(a) {
    setError('');
    setForm(a ? { title: a.title, date: a.date, time: a.time, notes: a.notes || '' } : { title: '', date: selected, time: '10:00', notes: '' });
    setEditing(a ? a._id : 'new');
  }
  async function save(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return setError('Title, date and time are required');
    try {
      if (editing === 'new') await Api.add(ev._id, 'activities', form); else await Api.update('activities', editing, form);
      setSelected(form.date); setView(monthOf(form.date));
      setEditing(null); toast(editing === 'new' ? 'Activity added' : 'Activity updated'); await reload();
    } catch (err) { setError(err.message); }
  }
  async function remove(id) {
    if (!window.confirm('Delete this activity?')) return;
    try { await Api.remove('activities', id); toast('Activity deleted'); await reload(); } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="toolbar"><span className="grow" />
        <Link className="btn btn-ai" to="/ai-planner#card-schedule">AI schedule assistant</Link>
        <button className="btn" onClick={() => openForm(null)}>+ Add activity</button></div>
      <section className="grid two-col">
        <div className="card rise">
          <div className="cal-head">
            <button className="btn btn-ghost btn-sm" aria-label="Previous month" onClick={() => setView(new Date(y, m - 1, 1))}>&lsaquo;</button>
            <h2>{view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>
            <button className="btn btn-ghost btn-sm" aria-label="Next month" onClick={() => setView(new Date(y, m + 1, 1))}>&rsaquo;</button>
          </div>
          <div className="cal">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div className="dow" key={d}>{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={'b' + i} />)}
            {days.map((d, i) => (
              <button key={d} className={'day' + (d === todayIso ? ' today' : '') + (d === selected ? ' selected' : '')} onClick={() => setSelected(d)}>
                <span className="num">{i + 1}</span>
                <span className="marks">
                  {acts.some(a => a.date === d) && <i className="mark act" />}
                  {tasks.some(t => t.deadline === d && !t.done) && <i className="mark task" />}
                  {ev.date === d && <i className="mark event" />}
                </span>
              </button>
            ))}
          </div>
          <div className="cal-legend"><span><i className="mark act" /> Activity</span><span><i className="mark task" /> Task deadline</span><span><i className="mark event" /> Event day</span></div>
        </div>
        <div>
          <div className="card rise" style={{ '--i': 1 }}>
            <h2>{fmtDate(selected)}</h2>
            {nothing && <p className="empty">Nothing planned for this day.</p>}
            {ev.date === selected && (
              <div className="list-item"><div><strong>{ev.name}</strong><small>Event day · {fmtTime(ev.time)}</small></div><span className="badge accepted">event</span></div>
            )}
            {dayActs.map(a => (
              <div className="list-item" key={a._id}>
                <div><strong>{a.title}</strong><small>{fmtTime(a.time)}{a.notes ? ' · ' + a.notes : ''}</small></div>
                <div className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openForm(a)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(a._id)}>Delete</button>
                </div>
              </div>
            ))}
            {dayTasks.map(t => (
              <div className="list-item" key={t._id}><div><strong>{t.title}</strong><small>Task deadline</small></div><span className={'badge ' + t.priority}>{t.priority}</span></div>
            ))}
          </div>
          <div className="card mt rise" style={{ '--i': 2 }}>
            <h2>All activities</h2>
            {all.length ? (
              <div className="timeline">
                {all.map(a => <div className="t" key={a._id}><strong>{a.title}</strong><small>{fmtDate(a.date)} · {fmtTime(a.time)}</small></div>)}
              </div>
            ) : <p className="empty">No activities yet. Add one or use the AI schedule assistant.</p>}
          </div>
        </div>
      </section>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add activity' : 'Edit activity'}>
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="a-title">Activity</label><input id="a-title" name="title" value={form.title} onChange={set} required /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="a-date">Date</label><input id="a-date" name="date" type="date" value={form.date} onChange={set} required /></div>
            <div className="field"><label htmlFor="a-time">Time</label><input id="a-time" name="time" type="time" value={form.time} onChange={set} required /></div>
          </div>
          <div className="field"><label htmlFor="a-notes">Notes</label><textarea id="a-notes" name="notes" rows="2" value={form.notes} onChange={set} /></div>
          <p className="error-text" role="alert">{error}</p>
          <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="btn">Save activity</button></div>
        </form>
      </Modal>
    </>
  );
}
