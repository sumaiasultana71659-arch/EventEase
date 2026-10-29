import { useState } from 'react';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import CountUp from '../components/CountUp';
import { Api } from '../api/api';
import { CATEGORIES } from '../config';
import { useCollection } from '../hooks';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { catLabel, fmtDate, iso, money, sum, today } from '../utils/format';

const blank = () => ({ title: '', category: CATEGORIES[0].key, amount: '', date: iso(today()) });

export default function Expenses() {
  const { current: ev } = useEvents();
  const toast = useToast();
  const { items: expenses, reload } = useCollection(ev._id, 'expenses');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [error, setError] = useState('');

  const spent = sum(expenses, e => e.amount);
  const remaining = ev.budget - spent;
  const pct = ev.budget ? Math.round(spent / ev.budget * 100) : 0;
  const list = expenses.filter(e => !filter || e.category === filter).sort((a, b) => b.date.localeCompare(a.date));
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });

  function openForm(x) {
    setError('');
    setForm(x ? { title: x.title, category: x.category, amount: x.amount, date: x.date } : blank());
    setEditing(x ? x._id : 'new');
  }
  async function save(e) {
    e.preventDefault();
    const data = { ...form, amount: Number(form.amount) };
    if (!data.title.trim()) return setError('Describe the expense');
    if (!(data.amount > 0)) return setError('Amount must be greater than 0');
    try {
      if (editing === 'new') await Api.add(ev._id, 'expenses', data); else await Api.update('expenses', editing, data);
      setEditing(null); toast(editing === 'new' ? 'Expense added' : 'Expense updated'); await reload();
      const fresh = await Api.list(ev._id, 'expenses');
      if (ev.budget && sum(fresh, x => x.amount) > ev.budget) toast('You are over the overall budget', 'error');
    } catch (err) { setError(err.message); }
  }
  async function remove(id) {
    if (!window.confirm('Delete this expense?')) return;
    try { await Api.remove('expenses', id); toast('Expense deleted'); await reload(); } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <>
      <section className="grid stats three">
        <div className="card stat rise lift"><span className="badge-ico tone-purple"><Icon name="budget" /></span><div><p>Total budget</p><strong><CountUp value={ev.budget} format={money} /></strong></div></div>
        <div className="card stat rise lift" style={{ '--i': 1 }}><span className="badge-ico tone-pink"><Icon name="expenses" /></span><div><p>Total spent</p><strong><CountUp value={spent} format={money} /></strong><small>{pct}% used</small></div></div>
        <div className="card stat rise lift" style={{ '--i': 2 }}><span className="badge-ico tone-green"><Icon name="budget" /></span><div><p>Remaining</p><strong className={remaining < 0 ? 'neg' : ''}><CountUp value={remaining} format={money} /></strong></div></div>
      </section>
      <div className="toolbar">
        <select aria-label="Filter by category" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All categories</option>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <span className="grow" />
        <button className="btn" onClick={() => openForm(null)}>+ Add expense</button>
      </div>
      <div className="card rise" style={{ '--i': 3 }}><div className="table-wrap"><table>
        <thead><tr><th>Expense</th><th>Category</th><th>Date</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan="5" className="empty">No expenses recorded</td></tr>}
          {list.map(x => (
            <tr key={x._id}>
              <td><strong>{x.title}</strong></td><td>{catLabel(x.category)}</td><td>{fmtDate(x.date)}</td><td>{money(x.amount)}</td>
              <td><div className="actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openForm(x)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(x._id)}>Delete</button></div></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add expense' : 'Edit expense'}>
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="x-title">What was it for?</label><input id="x-title" name="title" value={form.title} onChange={set} required /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={set}>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
            <div className="field"><label htmlFor="x-amount">Amount</label><input id="x-amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={set} required /></div>
          </div>
          <div className="field"><label htmlFor="x-date">Date</label><input id="x-date" name="date" type="date" value={form.date} onChange={set} required /></div>
          <p className="error-text" role="alert">{error}</p>
          <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="btn">Save expense</button></div>
        </form>
      </Modal>
    </>
  );
}
