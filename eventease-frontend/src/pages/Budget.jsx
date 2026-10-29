import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { Api } from '../api/api';
import { CATEGORIES, CAT_COLORS } from '../config';
import { useCollection } from '../hooks';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { money, sum } from '../utils/format';

const fromEvent = ev => {
  const f = { budget: ev.budget };
  CATEGORIES.forEach(c => { f[c.key] = (ev.allocation || {})[c.key] || 0; });
  return f;
};

export default function Budget() {
  const { current: ev, refresh } = useEvents();
  const toast = useToast();
  const { items: expenses } = useCollection(ev._id, 'expenses');
  const [form, setForm] = useState(() => fromEvent(ev));
  const [error, setError] = useState('');

  // reload the form when another event is selected or the saved budget changes
  useEffect(() => { setForm(fromEvent(ev)); }, [ev]);

  const set = e => setForm({ ...form, [e.target.name]: e.target.value });
  const read = () => {
    const allocation = {};
    CATEGORIES.forEach(c => { allocation[c.key] = Number(form[c.key]) || 0; });
    return { budget: Number(form.budget) || 0, allocation };
  };
  const { budget, allocation } = read();
  const used = sum(Object.values(allocation), v => v);
  const left = budget - used;
  const spent = sum(expenses, e => e.amount);
  const saved = ev.allocation || {};

  async function save(e) {
    e.preventDefault(); setError('');
    if (budget < 0 || Object.values(allocation).some(v => v < 0)) return setError('Amounts cannot be negative');
    if (used > budget) return setError('Category amounts add up to more than the overall budget');
    try { await Api.updateEvent(ev._id, { budget, allocation }); await refresh(); toast('Budget saved'); }
    catch (err) { setError(err.message); }
  }

  const fields = [['venue', 'b-venue'], ['food', 'b-food'], ['decoration', 'b-deco'], ['transportation', 'b-trans'], ['misc', 'b-misc']];

  return (
    <section className="grid equal">
      <div className="card rise">
        <div className="card-head"><h2>Set budget</h2><Link className="btn btn-ai btn-sm" to="/ai-planner#card-budget">AI recommendation</Link></div>
        <form onSubmit={save} noValidate>
          <div className="field"><label htmlFor="b-total">Overall budget</label><input id="b-total" name="budget" type="number" min="0" value={form.budget} onChange={set} required /></div>
          <div className="field-row">
            {fields.map(([key, id]) => {
              const c = CATEGORIES.find(x => x.key === key);
              return <div className="field" key={key}><label htmlFor={id}>{c.label}</label><input id={id} name={key} type="number" min="0" value={form[key]} onChange={set} /></div>;
            })}
          </div>
          <p className="hint">
            Allocated <strong>{money(used)}</strong> of <strong>{money(budget)}</strong> ·{' '}
            {left >= 0 ? <>Unallocated <strong>{money(left)}</strong></> : <strong className="neg">Over by {money(-left)}</strong>}
          </p>
          <p className="error-text" role="alert">{error}</p>
          <button className="btn" type="submit">Save budget</button>
        </form>
      </div>
      <div className="card rise" style={{ '--i': 1 }}>
        <h2>Financial overview</h2>
        {CATEGORIES.map((c, i) => {
          const s = sum(expenses.filter(e => e.category === c.key), e => e.amount);
          const al = saved[c.key] || 0;
          const pct = al ? Math.round(s / al * 100) : (s ? 100 : 0);
          return (
            <div className="hbar" key={c.key}>
              <div className="hbar-top">
                <span><i className="dot" style={{ background: CAT_COLORS[i] }} />{c.label}</span>
                <span>{money(s)} of {money(al)} <small className="muted">({money(al - s)} left)</small></span>
              </div>
              <ProgressBar pct={pct} />
            </div>
          );
        })}
        <p className="hint">Total spent: {money(spent)} · Remaining of overall budget: {money(ev.budget - spent)}</p>
      </div>
    </section>
  );
}
