import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { useEvents } from '../context/EventContext';
import { useToast } from '../context/ToastContext';
import { buildNotifications } from '../utils/notifications';

const BADGE = { danger: ['overdue', 'urgent'], warning: ['pending', 'reminder'], info: ['info', 'info'] };

export default function Notifications() {
  const { current: ev } = useEvents();
  const toast = useToast();
  const [list, setList] = useState(null);

  useEffect(() => {
    let off = false;
    buildNotifications(ev).then(l => { if (!off) setList(l); }).catch(err => toast(err.message, 'error'));
    return () => { off = true; };
  }, [ev, toast]);

  return (
    <>
      <p className="hint" style={{ marginBottom: 14 }}>Reminders for deadlines, pending tasks and upcoming activities of the selected event.</p>
      {list === null && <p className="muted">Loading...</p>}
      {list && list.length === 0 && <EmptyState title="You are all caught up" text="No deadlines or reminders need your attention right now." />}
      {list && list.map((n, i) => (
        <div className={'notif rise ' + n.level} style={{ '--i': i }} key={i}>
          <span className={`badge ${BADGE[n.level][0]} tag`}>{BADGE[n.level][1]}</span>
          <div><strong>{n.title}</strong><div className="muted">{n.text}</div></div>
        </div>
      ))}
    </>
  );
}
