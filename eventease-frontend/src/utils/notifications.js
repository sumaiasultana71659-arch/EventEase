// Notifications are computed from the event data (same rules as the old notifications.js)
import { Api } from '../api/api';
import { daysUntil, fmtDate, fmtTime, money } from './format';

export async function buildNotifications(ev) {
  const [tasks, activities, guests, expenses] = await Promise.all(
    ['tasks', 'activities', 'guests', 'expenses'].map(c => Api.list(ev._id, c))
  );
  const out = [];
  tasks.filter(t => !t.done).forEach(t => {
    const d = daysUntil(t.deadline);
    if (d < 0) out.push({ level: 'danger', title: 'Overdue task', text: `${t.title} was due ${fmtDate(t.deadline)}.` });
    else if (d <= 3) out.push({ level: 'warning', title: 'Task due soon', text: `${t.title} is due ${d === 0 ? 'today' : 'in ' + d + ' day(s)'}.` });
  });
  activities.forEach(a => {
    const d = daysUntil(a.date);
    if (d >= 0 && d <= 3) out.push({ level: 'info', title: 'Upcoming activity', text: `${a.title} ${d === 0 ? 'is today' : 'is in ' + d + ' day(s)'} at ${fmtTime(a.time)}.` });
  });
  const left = daysUntil(ev.date);
  if (left >= 0 && left <= 7) out.push({ level: 'info', title: 'Event is close', text: `${ev.name} is ${left === 0 ? 'today' : 'in ' + left + ' day(s)'}.` });
  const pending = guests.filter(g => g.rsvp === 'pending').length;
  if (pending && left >= 0 && left <= 14) out.push({ level: 'warning', title: 'RSVPs missing', text: `${pending} guest(s) have not replied yet.` });
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  if (ev.budget && spent > ev.budget) out.push({ level: 'danger', title: 'Over budget', text: `You have spent ${money(spent - ev.budget)} more than the budget.` });
  else if (ev.budget && spent / ev.budget >= 0.9) out.push({ level: 'warning', title: 'Budget almost used', text: `${Math.round(spent / ev.budget * 100)}% of the budget is spent.` });
  const order = { danger: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
