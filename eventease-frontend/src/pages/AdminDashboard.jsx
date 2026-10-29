import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CountUp from '../components/CountUp';
import Icon from '../components/Icon';
import Img from '../components/Img';
import ProgressBar from '../components/ProgressBar';
import { Api } from '../api/api';
import { coverFor } from '../data/images';
import { CAT_COLORS } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { daysUntil, fmtDate, money } from '../utils/format';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [d, setD] = useState(null);
  useEffect(() => { Api.admin.stats().then(setD).catch(err => toast(err.message, 'error')); }, [toast]);
  if (!d) return <p className="muted">Loading...</p>;

  const t = d.totals;
  const maxMonth = Math.max(1, ...d.months.map(m => m.requests));
  const maxType = Math.max(1, ...d.byType.map(x => x.count));
  const decided = t.approved + t.rejected;
  const hour = new Date().getHours();

  const cards = [
    ['orange', 'inbox', 'Waiting for review', <CountUp value={t.pending} />, 'needs a decision'],
    ['green', 'check', 'Approved events', <CountUp value={t.approved} />, decided ? Math.round(t.approved / decided * 100) + '% approval rate' : 'none decided yet'],
    ['blue', 'guests', 'Users', <CountUp value={t.users} />, t.guests + ' guests'],
    ['purple', 'budget', 'Approved budget', <CountUp value={t.approvedBudget} format={money} />, t.expectedGuests.toLocaleString() + ' expected guests']
  ];

  return (
    <>
      <p className="greet">{hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, {user.name.split(' ')[0]}.
        {' '}{t.pending > 0 ? `You have ${t.pending} request${t.pending > 1 ? 's' : ''} waiting.` : 'Everything is reviewed.'}</p>

      {/* the work comes first */}
      <section className="card todo rise">
        <div className="card-head"><h2>Needs your attention</h2>
          <div className="actions">
            <Link className="btn btn-ghost btn-sm" to="/admin/requests">All requests</Link>
            <Link className="btn btn-ghost btn-sm" to="/admin/admins">Add admin</Link>
          </div></div>
        {d.pending.length === 0 && <p className="empty">Nothing is waiting. New requests will show up here.</p>}
        {d.pending.map(r => {
          const days = daysUntil(r.date);
          return (
            <div className="list-item mini-row" key={r._id}>
              <div className="mini-img"><Img src={coverFor(r.type)} type={r.type} alt="" /></div>
              <div className="grow"><strong>{r.name}</strong>
                <small>{r.user?.name} · {r.type} · {r.guests} guests · {fmtDate(r.date)}{days >= 0 && days < 30 ? ' (soon)' : ''}</small></div>
              <strong className="hide-sm">{money(r.budget)}</strong>
              <Link className="btn btn-sm" to={'/admin/requests?open=' + r._id}>Review</Link>
            </div>
          );
        })}
      </section>

      <section className="grid stats mt">
        {cards.map(([tone, ico, label, val, sub], i) => (
          <div className="card stat rise lift" style={{ '--i': i }} key={label}>
            <span className={'badge-ico tone-' + tone}><Icon name={ico} /></span>
            <div><p>{label}</p><strong>{val}</strong><small>{sub}</small></div>
          </div>
        ))}
      </section>

      <section className="grid two-col">
        <div className="card rise" style={{ '--i': 4 }}>
          <div className="card-head"><h2>Requests, last 6 months</h2>
            <div className="chart-key"><span><i style={{ background: 'var(--c1)' }} />Received</span><span><i style={{ background: 'var(--pink)' }} />Approved</span></div></div>
          <div className="bars">
            {d.months.map(m => (
              <div className="bar-col" key={m.month}>
                <div className="bar-pair">
                  <i className="bar a" style={{ height: m.requests / maxMonth * 100 + '%' }} title={m.requests + ' received'} />
                  <i className="bar b" style={{ height: m.approved / maxMonth * 100 + '%' }} title={m.approved + ' approved'} />
                </div>
                <small>{m.month}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="card rise" style={{ '--i': 5 }}>
          <h2>Events by type</h2>
          {d.byType.length ? d.byType.map((x, i) => (
            <div className="hbar" key={x.type}>
              <div className="hbar-top"><span><i className="dot" style={{ background: CAT_COLORS[i % 5] }} />{x.type}</span><strong>{x.count}</strong></div>
              <ProgressBar pct={x.count / maxType * 100} color={CAT_COLORS[i % 5]} />
            </div>
          )) : <p className="empty">No approved events yet.</p>}
        </div>
      </section>
    </>
  );
}
