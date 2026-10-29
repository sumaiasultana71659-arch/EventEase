import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import CountUp from '../components/CountUp';
import ProgressBar from '../components/ProgressBar';
import Img from '../components/Img';
import { coverFor } from '../data/images';
import { Api } from '../api/api';
import { CATEGORIES, CAT_COLORS } from '../config';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { daysUntil, fmtDate, fmtTime, money, sum } from '../utils/format';

function Stat({ i, tone, ico, label, children, sub }) {
  return (
    <div className="card stat rise lift" style={{ '--i': i }}>
      <span className={'badge-ico tone-' + tone}><Icon name={ico} /></span>
      <div><p>{label}</p><strong>{children}</strong>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

export default function Dashboard() {
  const { current: ev } = useEvents();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let off = false;
    setData(null);
    Promise.all(['guests', 'tasks', 'activities', 'expenses'].map(c => Api.list(ev._id, c)))
      .then(([guests, tasks, activities, expenses]) => { if (!off) setData({ guests, tasks, activities, expenses }); })
      .catch(err => toast(err.message, 'error'));
    return () => { off = true; };
  }, [ev._id, toast]);

  const loadSummary = useCallback(async () => {
    setSummary(null);
    try { setSummary((await Api.ai.summary(ev._id)).summary); }
    catch (err) { setSummary([err.message]); }
  }, [ev._id]);
  useEffect(() => { loadSummary(); }, [loadSummary]);

  if (!data) return <p className="muted">Loading...</p>;

  const { guests, tasks, activities, expenses } = data;
  const spent = sum(expenses, e => e.amount);
  const remaining = ev.budget - spent;
  const pct = ev.budget ? Math.round(spent / ev.budget * 100) : 0;
  const pending = tasks.filter(t => !t.done);
  const accepted = guests.filter(g => g.rsvp === 'accepted').length;
  const upcoming = activities.filter(a => daysUntil(a.date) >= 0).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const left = daysUntil(ev.date);
  const byCat = CATEGORIES.map((c, i) => ({ ...c, color: CAT_COLORS[i], total: sum(expenses.filter(e => e.category === c.key), e => e.amount) }));
  const donutColor = pct > 100 ? 'var(--red)' : pct >= 90 ? 'var(--amber)' : 'var(--purple)';

  return (
    <>
      <section className="card hero-card rise">
        <Img src={coverFor(ev.type)} type={ev.type} className="hero-bg kenburns" eager />
        <div className="hero-shade" />
        <div className="hero-inner">
          <div><h2>{ev.name}</h2><p>{fmtDate(ev.date)} at {fmtTime(ev.time)} · {ev.venue}</p></div>
          <div className="countdown"><strong><CountUp value={left >= 0 ? left : 0} /></strong>{left < 0 ? 'event finished' : 'days to go'}</div>
        </div>
      </section>

      <section className="grid stats three">
        <Stat i={1} tone="purple" ico="budget" label="Total budget"><CountUp value={ev.budget} format={money} /></Stat>
        <Stat i={2} tone="pink" ico="expenses" label="Total expenses" sub={`${pct}% of budget`}><CountUp value={spent} format={money} /></Stat>
        <Stat i={3} tone="green" ico="budget" label="Remaining budget"><span className={remaining < 0 ? 'neg' : ''}><CountUp value={remaining} format={money} /></span></Stat>
        <Stat i={4} tone="blue" ico="guests" label="Guests" sub={`${accepted} accepted`}><CountUp value={guests.length} /> <small>/ {ev.guests} expected</small></Stat>
        <Stat i={5} tone="orange" ico="tasks" label="Pending tasks" sub={`${tasks.length - pending.length} of ${tasks.length} done`}><CountUp value={pending.length} /></Stat>
        <Stat i={6} tone="red" ico="schedule" label="Upcoming activities"><CountUp value={upcoming.length} /></Stat>
      </section>

      <section className="grid equal">
        <div className="card rise" style={{ '--i': 3 }}>
          <h2>Budget utilisation</h2>
          <div className="donut-row">
            <div className="donut" style={{ '--pct': Math.min(pct, 100), '--col': donutColor }}>
              <div className="donut-inner"><div><strong>{pct}%</strong><small>used</small></div></div>
            </div>
            <div className="legend">
              <div><span>Spent</span><strong>{money(spent)}</strong></div>
              <div><span>Remaining</span><strong className={remaining < 0 ? 'neg' : ''}>{money(remaining)}</strong></div>
              <div><span>Budget</span><strong>{money(ev.budget)}</strong></div>
            </div>
          </div>
        </div>
        <div className="card rise" style={{ '--i': 4 }}>
          <h2>Expense distribution</h2>
          {spent ? byCat.map(c => (
            <div className="hbar" key={c.key}>
              <div className="hbar-top"><span><i className="dot" style={{ background: c.color }} />{c.label}</span><strong>{money(c.total)}</strong></div>
              <ProgressBar pct={c.total / spent * 100} color={c.color} />
            </div>
          )) : <p className="empty">No expenses recorded yet.</p>}
        </div>
      </section>

      <section className="grid equal mt">
        <div className="card rise" style={{ '--i': 5 }}>
          <div className="card-head"><h2>Pending tasks</h2><Link className="btn btn-ghost btn-sm" to="/tasks">View all</Link></div>
          {pending.length ? [...pending].sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5).map(t => {
            const od = daysUntil(t.deadline) < 0;
            return (
              <div className="list-item" key={t._id}>
                <div><strong>{t.title}</strong><small>Due {fmtDate(t.deadline)}</small></div>
                <span className={'badge ' + (od ? 'overdue' : t.priority)}>{od ? 'overdue' : t.priority}</span>
              </div>
            );
          }) : <p className="empty">All tasks are done.</p>}
        </div>
        <div className="card rise" style={{ '--i': 6 }}>
          <div className="card-head"><h2>Upcoming activities</h2><Link className="btn btn-ghost btn-sm" to="/schedule">Open schedule</Link></div>
          {upcoming.length ? upcoming.slice(0, 5).map(a => (
            <div className="list-item" key={a._id}><div><strong>{a.title}</strong><small>{fmtDate(a.date)} · {fmtTime(a.time)}</small></div></div>
          )) : <p className="empty">No upcoming activities.</p>}
        </div>
      </section>

      <section className="card ai-card mt rise" style={{ '--i': 7 }}>
        <div className="card-head"><h2>AI event summary</h2><button className="btn btn-ai btn-sm" onClick={loadSummary}>Refresh summary</button></div>
        {summary
          ? <ul className="ai-list">{summary.map((l, i) => <li key={i}>{l}</li>)}</ul>
          : <div className="muted">Writing summary...</div>}
      </section>
    </>
  );
}
