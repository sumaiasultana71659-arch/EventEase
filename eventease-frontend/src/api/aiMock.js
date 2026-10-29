// ====== AI engine used when CONFIG.USE_MOCK = true ======
// It is rule-based so the demo works offline. In real mode the same five
// features are served by your Spring Boot backend, which calls an AI API:
//   POST /ai/plan  POST /ai/budget  POST /ai/tasks  POST /ai/schedule  GET /events/:id/ai-summary
import { CONFIG, CATEGORIES } from '../config';

export const AIMock = (() => {
  const SPLIT = {
    Wedding:    [35, 30, 15, 5, 15],
    Birthday:   [25, 35, 15, 5, 20],
    Corporate:  [30, 25, 10, 10, 25],
    Conference: [35, 25, 10, 5, 25],
    Concert:    [30, 10, 15, 10, 35],
    Other:      [30, 30, 15, 10, 15]
  };
  const COMMON_TASKS = [
    ['Confirm venue booking', 60], ['Finalise the guest list', 45], ['Send invitations', 30],
    ['Confirm catering menu', 21], ['Arrange transportation', 14], ['Finalise decoration plan', 10],
    ['Follow up on pending RSVPs', 7], ['Confirm final headcount with vendors', 3], ['Do a final venue walkthrough', 1]
  ];
  const EXTRA_TASKS = {
    Wedding: [['Book photographer and videographer', 55], ['Plan ceremony and reception flow', 30], ['Arrange guest accommodation', 25]],
    Birthday: [['Choose theme and order the cake', 20], ['Plan games and entertainment', 12]],
    Corporate: [['Prepare agenda and speaker list', 30], ['Arrange AV and projector setup', 10], ['Prepare name badges and welcome kits', 7]],
    Conference: [['Open speaker call and registration', 60], ['Publish the sessions schedule', 30], ['Arrange AV and Wi-Fi', 10], ['Set up registration desk and badges', 7]],
    Concert: [['Book artists and sound crew', 55], ['Set up ticketing', 45], ['Arrange security and crowd control', 20], ['Do a sound check', 1]],
    Other: [['Prepare the programme outline', 20]]
  };
  const TIPS = {
    Wedding: ['Book the venue and photographer first; the best dates go early.', 'Keep a 10% contingency for last-minute changes.'],
    Birthday: ['Pick a theme early; it decides decoration, cake and music.', 'Plan one or two activities so guests are not idle.'],
    Corporate: ['Share the agenda with attendees a week ahead.', 'Test AV equipment the day before.'],
    Conference: ['Open registration early and send reminders to speakers.', 'Plan breaks and networking time between sessions.'],
    Concert: ['Secure the sound crew and security early.', 'Sell tickets in phases to boost early sales.'],
    Other: ['Write the programme outline first, then assign owners to each part.']
  };
  const TIMELINE = [
    ['Kick-off planning and approve budget', 60], ['Venue and main vendors booked', 45],
    ['Invitations sent', 30], ['RSVP deadline', 10], ['Final vendor confirmations', 5],
    ['Rehearsal / walkthrough', 2]
  ];

  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const daysLeft = date => Math.round((new Date(date + 'T00:00:00') - today()) / 86400000);
  // Shrink lead times when the event is closer than 60 days
  function dateFor(date, daysBefore) {
    const left = Math.max(daysLeft(date), 0);
    const scaled = Math.round(daysBefore * Math.min(1, left / 60));
    const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() - scaled);
    return iso(d < today() ? today() : d);
  }
  const money = n => CONFIG.CURRENCY + Math.round(n).toLocaleString();

  return {
    plan({ type, guests, date, budget }) {
      const left = daysLeft(date), per = guests ? budget / guests : 0;
      const out = [];
      out.push(`Your budget works out to about ${money(per)} per guest for ${guests} guests.`);
      out.push(left < 0 ? 'The event date has passed. Pick a new date to get a timeline.'
        : left < 14 ? `Only ${left} day(s) left. Book venue and catering first and keep the guest list short.`
        : `You have ${left} days to prepare, which is enough time to follow the full checklist.`);
      out.push(`Choose a venue that seats at least ${Math.ceil(guests * 1.1)} people (10% spare room).`);
      out.push(...(TIPS[type] || TIPS.Other));
      out.push('Keep 5-10% of the budget unallocated for surprises.');
      return Promise.resolve({ headline: `${type} plan for ${guests} guests`, suggestions: out });
    },
    budget({ type, budget }) {
      const pct = SPLIT[type] || SPLIT.Other;
      const allocation = {}; let used = 0;
      CATEGORIES.forEach((c, i) => {
        allocation[c.key] = i === CATEGORIES.length - 1 ? Math.round(budget) - used : Math.round(budget * pct[i] / 100);
        used += allocation[c.key];
      });
      return Promise.resolve({ allocation, percentages: pct, note: `Typical split for a ${type.toLowerCase()} event.` });
    },
    tasks({ type, date }) {
      const list = [...COMMON_TASKS, ...(EXTRA_TASKS[type] || EXTRA_TASKS.Other)].sort((a, b) => b[1] - a[1]);
      return Promise.resolve(list.map(([title, d]) => ({ title, deadline: dateFor(date, d), priority: d >= 30 ? 'high' : d >= 7 ? 'medium' : 'low' })));
    },
    schedule({ date, time }) {
      const items = TIMELINE.map(([title, d]) => ({ title, date: dateFor(date, d), time: '10:00', notes: 'Suggested by AI' }));
      items.push({ title: 'Event day', date, time: time || '10:00', notes: 'Suggested by AI' });
      return Promise.resolve(items);
    },
    summary({ event, guests, tasks, expenses, activities }) {
      const spent = expenses.reduce((s, e) => s + e.amount, 0);
      const pct = event.budget ? Math.round(spent / event.budget * 100) : 0;
      const count = r => guests.filter(g => g.rsvp === r).length;
      const done = tasks.filter(t => t.done).length;
      const pending = tasks.length - done;
      const overdue = tasks.filter(t => !t.done && daysLeft(t.deadline) < 0).length;
      const byCat = {}; expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + e.amount);
      const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
      const left = daysLeft(event.date);
      const lines = [];
      lines.push(`${event.name} is ${left > 0 ? 'in ' + left + ' days' : left === 0 ? 'today' : 'already over'}.`);
      lines.push(`Budget: ${money(spent)} spent of ${money(event.budget)} (${pct}%), ${money(event.budget - spent)} remaining` + (top ? `. Biggest spend is ${top[0]} at ${money(top[1])}.` : '.'));
      lines.push(`Guests: ${guests.length} invited (expected ${event.guests}); ${count('accepted')} accepted, ${count('declined')} declined, ${count('pending')} waiting for a reply.`);
      lines.push(`Tasks: ${done} of ${tasks.length} done, ${pending} pending` + (overdue ? `, ${overdue} overdue.` : '.'));
      const attention = [];
      if (pct > 100) attention.push('You are over budget; review the expenses.');
      else if (pct >= 90) attention.push('Over 90% of the budget is used.');
      if (overdue) attention.push('Clear the overdue tasks first.');
      if (count('pending') && left <= 14 && left >= 0) attention.push('Follow up with guests who have not replied.');
      if (!activities.length) attention.push('No schedule yet; try the AI schedule assistant.');
      if (attention.length) lines.push('Needs attention: ' + attention.join(' '));
      return Promise.resolve({ summary: lines });
    }
  };
})();
