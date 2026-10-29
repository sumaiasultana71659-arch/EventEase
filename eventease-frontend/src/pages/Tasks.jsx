import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { Api } from '../api/api';
import { useCollection } from '../hooks';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { daysUntil, fmtDate, iso, today } from '../utils/format';

const blank = () => ({ title: '', deadline: iso(today()), priority: 'medium' });

export default function Tasks() {
  const { current: ev } = useEvents();
  const toast = useToast();
  const { items: tasks, setItems, reload } = useCollection(ev._id, 'tasks');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [error, setError] = useState('');

  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const list = tasks.filter(t => filter === 'done' ? t.done : filter === 'pending' ? !t.done : true)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.deadline.localeCompare(b.deadline));
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  function openForm(t) { setError(''); setForm(t ? { title: t.title, deadline: t.deadline, priority: t.priority } : blank()); setEditing(t ? t._id : 'new'); }

  async function save(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Task title is required');
    if (!form.deadline) return setError('Choose a deadline');
    try {
      if (editing === 'new') await Api.add(ev._id, 'tasks', { ...form, done: false }); else await Api.update('tasks', editing, form);
      setEditing(null); toast(editing === 'new' ? 'Task added' : 'Task updated'); await reload();
    } catch (err) { setError(err.message); }
  }
  // optimistic: tick the box immediately, then sync with the server
  async function toggle(id, value) {
    setItems(tasks.map(t => (t._id === id ? { ...t, done: value } : t)));
    try { await Api.update('tasks', id, { done: value }); await reload(); } catch (err) { toast(err.message, 'error'); reload(); }
  }
  async function remove(id) {
    if (!window.confirm('Delete this task?')) return;
    try { await Api.remove('tasks', id); toast('Task deleted'); await reload(); } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <div className="card rise" style={{ marginBottom: 20 }}>
        <div className="hbar-top"><span><strong>Preparation progress</strong></span><strong>{done} of {tasks.length} done ({pct}%)</strong></div>
        <div className="progress pink"><i style={{ width: pct + '%' }} /></div>
      </div>
      <div className="toolbar">
        <select aria-label="Filter tasks" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All tasks</option><option value="pending">Pending</option><option value="done">Completed</option>
        </select>
        <span className="grow" />
        <Link className="btn btn-ai" to="/ai-planner#card-tasks">Generate with AI</Link>
        <button className="btn" onClick={() => openForm(null)}>+ Add task</button>
      </div>
      <div className="card rise" style={{ '--i': 2 }}>
        {list.length === 0 && <p className="empty">No tasks here. Add one or generate a checklist with AI.</p>}
        {list.map(t => {
          const od = !t.done && daysUntil(t.deadline) < 0;
          return (
            <div className={'task' + (t.done ? ' is-done' : '')} key={t._id}>
              <input type="checkbox" checked={!!t.done} onChange={e => toggle(t._id, e.target.checked)} aria-label={`Mark ${t.title} complete`} />
              <div className="task-body"><div className="task-title">{t.title}</div><small className="muted">Due {fmtDate(t.deadline)}</small></div>
              <span className={'badge ' + (od ? 'overdue' : t.priority)}>{od ? 'overdue' : t.priority}</span>
              <div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openForm(t)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(t._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add task' : 'Edit task'}>
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="title">Task</label><input id="title" name="title" value={form.title} onChange={set} required /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="deadline">Deadline</label><input id="deadline" name="deadline" type="date" value={form.deadline} onChange={set} required /></div>
            <div className="field"><label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={set}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
          <p className="error-text" role="alert">{error}</p>
          <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="btn">Save task</button></div>
        </form>
      </Modal>
    </>
  );
}
