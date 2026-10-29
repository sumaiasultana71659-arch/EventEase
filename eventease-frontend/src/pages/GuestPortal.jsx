import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { EventCover } from '../components/Illustrations';
import { Api } from '../api/api';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime } from '../utils/format';

export default function GuestPortal() {
  const toast = useToast();
  const [list, setList] = useState(null);

  const load = useCallback(async () => {
    try { setList(await Api.invitations()); } catch (err) { toast(err.message, 'error'); setList([]); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  async function respond(id, rsvp) {
    try {
      await Api.rsvp(id, rsvp);
      toast(rsvp === 'accepted' ? 'You accepted the invitation' : 'You declined the invitation');
      await load();
    } catch (err) { toast(err.message, 'error'); }
  }

  if (list === null) return <p className="muted">Loading...</p>;
  if (!list.length) return <EmptyState title="No invitations yet" text="When an organizer adds your email to a guest list, the event will appear here." />;

  return list.map(({ guest, event, activities }, i) => (
    <article className="card invite rise" style={{ '--i': i, marginBottom: 20 }} key={guest._id}>
      <div className="event-cover invite-cover"><EventCover type={event.type} /><span className="cover-tag">{event.type}</span></div>
      <div className="card-head">
        <div><h2 style={{ margin: 0 }}>{event.name}</h2><span className="muted">{event.type} event</span></div>
        <div><span className={'badge ' + guest.rsvp}>RSVP: {guest.rsvp}</span> <span className={'badge ' + guest.attendance}>Attendance: {guest.attendance}</span></div>
      </div>
      <dl className="info-grid">
        <div><dt>Date</dt><dd>{fmtDate(event.date)}</dd></div><div><dt>Time</dt><dd>{fmtTime(event.time)}</dd></div>
        <div><dt>Venue</dt><dd>{event.venue}</dd></div>
        <div><dt>Organizer</dt><dd>{event.organizerName} {event.organizerPhone ? '· ' + event.organizerPhone : ''}</dd></div>
      </dl>
      <p style={{ margin: '14px 0' }}>{event.description}</p>
      <h2>Schedule</h2>
      {activities.length ? (
        <div className="timeline">
          {activities.map(a => <div className="t" key={a._id}><strong>{a.title}</strong><small>{fmtDate(a.date)} · {fmtTime(a.time)}</small></div>)}
        </div>
      ) : <p className="muted">The schedule has not been published yet.</p>}
      <div className="actions mt" style={{ flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => respond(guest._id, 'accepted')} disabled={guest.rsvp === 'accepted'}>Accept invitation</button>
        <button className="btn btn-ghost" onClick={() => respond(guest._id, 'declined')} disabled={guest.rsvp === 'declined'}>Decline</button>
      </div>
    </article>
  ));
}
