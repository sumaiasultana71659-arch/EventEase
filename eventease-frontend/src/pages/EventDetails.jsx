import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EventCover } from '../components/Illustrations';
import { useCollection } from '../hooks';
import { useEvents } from '../context/EventContext';
import { fmtDate, fmtTime, money } from '../utils/format';

export default function EventDetails() {
  const { id } = useParams();
  const { events, current, setCurrent } = useEvents();

  // opening /events/:id makes that event the current one (same as the old ?id= behaviour)
  useEffect(() => { if (events.some(e => e._id === id)) setCurrent(id); }, [id, events, setCurrent]);

  const ev = events.find(e => e._id === id) || current;
  const { items: activities } = useCollection(ev._id, 'activities');
  const { items: guests } = useCollection(ev._id, 'guests');
  const sorted = [...activities].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <>
      <div className="details-cover rise"><EventCover type={ev.type} /></div>
      <div className="page-head">
        <div><h2 style={{ fontSize: 24 }}>{ev.name}</h2><p>{ev.type} event</p></div>
        <Link className="btn btn-ghost" to="/events">Back to events</Link>
      </div>
      <section className="grid two-col">
        <div className="card rise" style={{ '--i': 1 }}>
          <h2>Event information</h2>
          <dl className="info-grid">
            <div><dt>Date</dt><dd>{fmtDate(ev.date)}</dd></div>
            <div><dt>Time</dt><dd>{fmtTime(ev.time)}</dd></div>
            <div><dt>Venue</dt><dd>{ev.venue}</dd></div>
            <div><dt>Event type</dt><dd>{ev.type}</dd></div>
            <div><dt>Expected guests</dt><dd>{ev.guests} ({guests.length} on the list)</dd></div>
            <div><dt>Budget</dt><dd>{money(ev.budget)}</dd></div>
          </dl>
          <h2 className="mt">Description</h2>
          <p>{ev.description || <span className="muted">No description added.</span>}</p>
        </div>
        <div className="card rise" style={{ '--i': 2 }}>
          <h2>Organizer</h2>
          <dl className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div><dt>Name</dt><dd>{ev.organizerName || '-'}</dd></div>
            <div><dt>Phone</dt><dd>{ev.organizerPhone || '-'}</dd></div>
          </dl>
          <h2 className="mt">Quick links</h2>
          <div className="actions" style={{ flexWrap: 'wrap' }}>
            <Link className="btn btn-ghost btn-sm" to="/guests">Guests</Link>
            <Link className="btn btn-ghost btn-sm" to="/tasks">Tasks</Link>
            <Link className="btn btn-ghost btn-sm" to="/budget">Budget</Link>
          </div>
        </div>
      </section>
      <section className="card mt rise" style={{ '--i': 3 }}>
        <div className="card-head"><h2>Schedule</h2><Link className="btn btn-ghost btn-sm" to="/schedule">Manage schedule</Link></div>
        {sorted.length ? (
          <div className="timeline">
            {sorted.map(a => (
              <div className="t" key={a._id}><strong>{a.title}</strong>
                <small>{fmtDate(a.date)} · {fmtTime(a.time)}{a.notes ? ' · ' + a.notes : ''}</small></div>
            ))}
          </div>
        ) : <p className="empty">No activities yet.</p>}
      </section>
    </>
  );
}
