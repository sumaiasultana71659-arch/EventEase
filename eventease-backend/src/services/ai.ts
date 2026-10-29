// Rule-based "AI" (same logic the frontend mock used). To use a real AI (Claude / OpenAI),
// replace the bodies of these functions with an API call - the routes and the frontend stay the same.
import { config } from '../config';

export const CATEGORY_KEYS = ['venue', 'food', 'decoration', 'transportation', 'misc'] as const;

const SPLIT: Record<string, number[]> = {
  Wedding: [35, 30, 15, 5, 15],
  Birthday: [25, 35, 15, 5, 20],
  Corporate: [30, 25, 10, 10, 25],
  Conference: [35, 25, 10, 5, 25],
  Concert: [30, 10, 15, 10, 35],
  Other: [30, 30, 15, 10, 15]
};

const COMMON_TASKS: [string, number][] = [
  ['Confirm venue booking', 60], ['Finalise the guest list', 45], ['Send invitations', 30],
  ['Confirm catering menu', 21], ['Arrange transportation', 14], ['Finalise decoration plan', 10],
  ['Follow up on pending RSVPs', 7], ['Confirm final headcount with vendors', 3], ['Do a final venue walkthrough', 1]
];

const EXTRA_TASKS: Record<string, [string, number][]> = {
  Wedding: [['Book photographer and videographer', 55], ['Plan ceremony and reception flow', 30], ['Arrange guest accommodation', 25]],
  Birthday: [['Choose theme and order the cake', 20], ['Plan games and entertainment', 12]],
  Corporate: [['Prepare agenda and speaker list', 30], ['Arrange AV and projector setup', 10], ['Prepare name badges and welcome kits', 7]],
  Conference: [['Open speaker call and registration', 60], ['Publish the sessions schedule', 30], ['Arrange AV and Wi-Fi', 10], ['Set up registration desk and badges', 7]],
  Concert: [['Book artists and sound crew', 55], ['Set up ticketing', 45], ['Arrange security and crowd control', 20], ['Do a sound check', 1]],
  Other: [['Prepare the programme outline', 20]]
};

const TIPS: Record<string, string[]> = {
  Wedding: ['Book the venue and photographer first; the best dates go early.', 'Keep a 10% contingency for last-minute changes.'],
  Birthday: ['Pick a theme early; it decides decoration, cake and music.', 'Plan one or two activities so guests are not idle.'],
  Corporate: ['Share the agenda with attendees a week ahead.', 'Test AV equipment the day before.'],
  Conference: ['Open registration early and send reminders to speakers.', 'Plan breaks and networking time between sessions.'],
  Concert: ['Secure the sound crew and security early.', 'Sell tickets in phases to boost early sales.'],
  Other: ['Write the programme outline first, then assign owners to each part.']
};

const TIMELINE: [string, number][] = [
  ['Kick-off planning and approve budget', 60], ['Venue and main vendors booked', 45],
  ['Invitations sent', 30], ['RSVP deadline', 10], ['Final vendor confirmations', 5],
  ['Rehearsal / walkthrough', 2]
];

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const iso = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const daysLeft = (date: string) => Math.round((new Date(date + 'T00:00:00').getTime() - today().getTime()) / 86400000);
const money = (n: number) => config.currency + Math.round(n).toLocaleString('en-US');

// Shrink lead times when the event is closer than 60 days
function dateFor(date: string, daysBefore: number): string {
  const left = Math.max(daysLeft(date), 0);
  const scaled = Math.round(daysBefore * Math.min(1, left / 60));
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() - scaled);
  return iso(d < today() ? today() : d);
}

export interface AiInput { type: string; guests: number; date: string; budget: number; time?: string }

export function plan({ type, guests, date, budget }: AiInput) {
  const left = daysLeft(date);
  const per = guests ? budget / guests : 0;
  const out: string[] = [];
  out.push(`Your budget works out to about ${money(per)} per guest for ${guests} guests.`);
  out.push(
    left < 0 ? 'The event date has passed. Pick a new date to get a timeline.'
      : left < 14 ? `Only ${left} day(s) left. Book venue and catering first and keep the guest list short.`
      : `You have ${left} days to prepare, which is enough time to follow the full checklist.`
  );
  out.push(`Choose a venue that seats at least ${Math.ceil(guests * 1.1)} people (10% spare room).`);
  out.push(...(TIPS[type] || TIPS.Other));
  out.push('Keep 5-10% of the budget unallocated for surprises.');
  return { headline: `${type} plan for ${guests} guests`, suggestions: out };
}

export function budgetSplit({ type, budget }: AiInput) {
  const pct = SPLIT[type] || SPLIT.Other;
  const allocation: Record<string, number> = {};
  let used = 0;
  CATEGORY_KEYS.forEach((key, i) => {
    allocation[key] = i === CATEGORY_KEYS.length - 1 ? Math.round(budget) - used : Math.round((budget * pct[i]) / 100);
    used += allocation[key];
  });
  return { allocation, percentages: pct, note: `Typical split for a ${type.toLowerCase()} event.` };
}

export function tasks({ type, date }: AiInput) {
  const list = [...COMMON_TASKS, ...(EXTRA_TASKS[type] || EXTRA_TASKS.Other)].sort((a, b) => b[1] - a[1]);
  return list.map(([title, d]) => ({
    title,
    deadline: dateFor(date, d),
    priority: (d >= 30 ? 'high' : d >= 7 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
  }));
}

export function schedule({ date, time }: AiInput) {
  const items = TIMELINE.map(([title, d]) => ({ title, date: dateFor(date, d), time: '10:00', notes: 'Suggested by AI' }));
  items.push({ title: 'Event day', date, time: time || '10:00', notes: 'Suggested by AI' });
  return items;
}

interface SummaryData {
  event: { name: string; date: string; budget: number; guests: number };
  guests: { rsvp: string }[];
  tasks: { done: boolean; deadline: string }[];
  expenses: { amount: number; category: string }[];
  activities: unknown[];
}

export function summary({ event, guests, tasks, expenses, activities }: SummaryData) {
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = event.budget ? Math.round((spent / event.budget) * 100) : 0;
  const count = (r: string) => guests.filter(g => g.rsvp === r).length;
  const done = tasks.filter(t => t.done).length;
  const pending = tasks.length - done;
  const overdue = tasks.filter(t => !t.done && daysLeft(t.deadline) < 0).length;
  const byCat: Record<string, number> = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const left = daysLeft(event.date);

  const lines: string[] = [];
  lines.push(`${event.name} is ${left > 0 ? 'in ' + left + ' days' : left === 0 ? 'today' : 'already over'}.`);
  lines.push(
    `Budget: ${money(spent)} spent of ${money(event.budget)} (${pct}%), ${money(event.budget - spent)} remaining` +
      (top ? `. Biggest spend is ${top[0]} at ${money(top[1])}.` : '.')
  );
  lines.push(`Guests: ${guests.length} invited (expected ${event.guests}); ${count('accepted')} accepted, ${count('declined')} declined, ${count('pending')} waiting for a reply.`);
  lines.push(`Tasks: ${done} of ${tasks.length} done, ${pending} pending` + (overdue ? `, ${overdue} overdue.` : '.'));

  const attention: string[] = [];
  if (pct > 100) attention.push('You are over budget; review the expenses.');
  else if (pct >= 90) attention.push('Over 90% of the budget is used.');
  if (overdue) attention.push('Clear the overdue tasks first.');
  if (count('pending') && left <= 14 && left >= 0) attention.push('Follow up with guests who have not replied.');
  if (!activities.length) attention.push('No schedule yet; try the AI schedule assistant.');
  if (attention.length) lines.push('Needs attention: ' + attention.join(' '));
  return { summary: lines };
}

/* ---------------- Event suggestions from a user's preferences ---------------- */
export interface Preferences {
  budgetMin?: number | null; budgetMax?: number | null; guests?: number | null;
  types?: string[]; city?: string | null; vibe?: string | null;
}

interface Template {
  type: string; title: string; theme: string; venue: string;
  perGuest: number;                       // realistic all-in cost per guest (before style factor)
  minGuests: number; maxGuests: number; defaultGuests: number;
  time: string; dow: number;              // preferred weekday: 0 Sunday ... 6 Saturday
  leadWeeks: number;                      // how early it should be booked
  tags: string[];                         // outdoor | intimate | grand | fun | formal
  desc: string; includes: string[]; tip: string;
}

const T = (t: Template) => t;
const CATALOG: Template[] = [
  // Weddings
  T({ type: 'Wedding', title: 'Garden Wedding', theme: 'Outdoor ceremony and dinner', venue: 'Garden lawn with a marquee', perGuest: 48, minGuests: 60, maxGuests: 250, defaultGuests: 150, time: '17:00', dow: 5, leadWeeks: 14, tags: ['outdoor', 'fun'], desc: 'A ceremony at golden hour, then dinner under string lights.', includes: ['Ceremony arch and floral styling', 'Buffet dinner with a dessert table', 'Sound system and live acoustic set', 'Guest shuttle from the main road'], tip: 'Have a covered backup area ready in case of rain.' }),
  T({ type: 'Wedding', title: 'Grand Ballroom Wedding', theme: 'Formal reception', venue: 'Hotel ballroom', perGuest: 85, minGuests: 100, maxGuests: 400, defaultGuests: 220, time: '18:30', dow: 6, leadWeeks: 20, tags: ['grand', 'formal'], desc: 'A stage, a live band and a plated dinner in one venue.', includes: ['Ballroom with stage and lighting', 'Plated multi-course dinner', 'Live band and MC', 'Bridal suite for the day'], tip: 'Hotel ballrooms for peak dates are booked 4 to 6 months ahead.' }),
  T({ type: 'Wedding', title: 'Intimate Courtyard Wedding', theme: 'Small and personal', venue: 'Courtyard or boutique venue', perGuest: 70, minGuests: 20, maxGuests: 80, defaultGuests: 50, time: '16:30', dow: 6, leadWeeks: 10, tags: ['intimate', 'formal'], desc: 'Close family and friends, long tables and a set menu.', includes: ['Long-table styling with candles', 'Set menu with a signature drink', 'Photographer for 4 hours', 'Acoustic music'], tip: 'A small guest list lets you spend more per person on food and flowers.' }),
  // Birthdays
  T({ type: 'Birthday', title: 'Rooftop Birthday Party', theme: 'Evening with a view', venue: 'Rooftop lounge', perGuest: 32, minGuests: 15, maxGuests: 80, defaultGuests: 40, time: '19:00', dow: 6, leadWeeks: 4, tags: ['outdoor', 'fun'], desc: 'Cocktails, a DJ and a cake moment at sunset.', includes: ['Reserved rooftop section', 'Finger food and drinks package', 'DJ and sound', 'Photo corner'], tip: 'Ask for a plan B indoors during the rainy season.' }),
  T({ type: 'Birthday', title: 'Themed Kids Party', theme: 'Games and a custom theme', venue: 'Party hall or play area', perGuest: 18, minGuests: 10, maxGuests: 60, defaultGuests: 30, time: '16:00', dow: 6, leadWeeks: 3, tags: ['fun'], desc: 'Balloons, games, a host and a cake that matches the theme.', includes: ['Theme decoration and balloons', 'Entertainer and games', 'Snack boxes and cake', 'Return gifts'], tip: 'Keep it to 2 to 3 hours; children tire fast.' }),
  T({ type: 'Birthday', title: 'Milestone Birthday Dinner', theme: 'Sit-down dinner', venue: 'Restaurant private room', perGuest: 45, minGuests: 12, maxGuests: 60, defaultGuests: 30, time: '19:30', dow: 5, leadWeeks: 4, tags: ['formal', 'intimate'], desc: 'A set menu, a toast and a slideshow for a 30th, 40th or 50th.', includes: ['Private room with set menu', 'Custom cake', 'Table flowers', 'Slideshow screen'], tip: 'Pre-order the menu so the kitchen can serve everyone together.' }),
  // Corporate
  T({ type: 'Corporate', title: 'Annual Company Dinner', theme: 'Awards and dinner', venue: 'Hotel banquet hall', perGuest: 60, minGuests: 40, maxGuests: 350, defaultGuests: 120, time: '19:00', dow: 5, leadWeeks: 8, tags: ['formal', 'grand'], desc: 'Awards, live music and a sit-down dinner for the whole team.', includes: ['Banquet hall with stage and projector', 'Three-course dinner', 'MC and awards run-sheet', 'Photographer'], tip: 'Share the programme a week ahead so speakers can prepare.' }),
  T({ type: 'Corporate', title: 'Team Retreat', theme: 'Workshops and activities', venue: 'Resort with meeting rooms', perGuest: 90, minGuests: 15, maxGuests: 100, defaultGuests: 40, time: '09:00', dow: 5, leadWeeks: 8, tags: ['outdoor', 'fun'], desc: 'Workshops by day, team activities and a bonfire dinner at night.', includes: ['Meeting room and projector', 'Meals and tea breaks', 'Team-building facilitator', 'Transport from the office'], tip: 'Fix the agenda first, then choose the venue.' }),
  T({ type: 'Corporate', title: 'Client Appreciation Evening', theme: 'Networking reception', venue: 'Lounge or private dining room', perGuest: 55, minGuests: 20, maxGuests: 120, defaultGuests: 60, time: '18:30', dow: 4, leadWeeks: 5, tags: ['formal', 'intimate'], desc: 'Canapes, short remarks and time to talk.', includes: ['Reserved lounge', 'Canapes and drinks', 'Branded welcome table', 'Name badges'], tip: 'Keep speeches under 10 minutes in total.' }),
  // Conferences
  T({ type: 'Conference', title: 'One-Day Summit', theme: 'Keynotes and sessions', venue: 'Convention centre', perGuest: 65, minGuests: 100, maxGuests: 600, defaultGuests: 250, time: '09:30', dow: 4, leadWeeks: 14, tags: ['grand', 'formal'], desc: 'Keynotes, two parallel tracks, sponsor booths and a networking lunch.', includes: ['Main hall and two breakout rooms', 'Registration desk and badges', 'AV, Wi-Fi and recording', 'Lunch and two tea breaks'], tip: 'Open speaker applications at least 10 weeks before.' }),
  T({ type: 'Conference', title: 'Hands-on Workshop Day', theme: 'Small-group learning', venue: 'Training venue', perGuest: 40, minGuests: 15, maxGuests: 80, defaultGuests: 40, time: '10:00', dow: 6, leadWeeks: 6, tags: ['intimate'], desc: 'Two practical sessions, lunch and a closing Q and A.', includes: ['Training room with power for laptops', 'Lunch and refreshments', 'Printed materials', 'Certificates'], tip: 'Send setup instructions to attendees 3 days before.' }),
  T({ type: 'Conference', title: 'Product Launch Meetup', theme: 'Demo and networking', venue: 'Auditorium', perGuest: 50, minGuests: 40, maxGuests: 250, defaultGuests: 100, time: '17:30', dow: 4, leadWeeks: 6, tags: ['grand', 'fun'], desc: 'A demo stage, a press corner and a networking hour.', includes: ['Auditorium with stage and LED screen', 'Demo stations', 'Press and photo corner', 'Light dinner'], tip: 'Rehearse the demo on the venue Wi-Fi the day before.' }),
  // Concerts
  T({ type: 'Concert', title: 'Open-Air Live Night', theme: 'Headliner and two acts', venue: 'Open-air arena', perGuest: 35, minGuests: 200, maxGuests: 2000, defaultGuests: 500, time: '18:00', dow: 6, leadWeeks: 16, tags: ['outdoor', 'fun', 'grand'], desc: 'A headliner, two support acts, food stalls and a light show.', includes: ['Stage, sound and lighting', 'Security and crowd control', 'Ticketing and entry gates', 'Food stalls and first aid'], tip: 'Apply for the local event permit early; it often takes weeks.' }),
  T({ type: 'Concert', title: 'Acoustic Evening', theme: 'Seated and intimate', venue: 'Courtyard stage', perGuest: 26, minGuests: 60, maxGuests: 250, defaultGuests: 150, time: '19:30', dow: 5, leadWeeks: 8, tags: ['intimate', 'outdoor'], desc: 'A seated set with candles, a small bar and great sound.', includes: ['Small stage and sound', 'Seating and candles', 'Small bar', 'Ticketing'], tip: 'Seated shows sell better with numbered seats.' }),
  T({ type: 'Concert', title: 'Campus Music Fest', theme: 'Student bands', venue: 'University ground', perGuest: 18, minGuests: 150, maxGuests: 1500, defaultGuests: 400, time: '16:00', dow: 5, leadWeeks: 10, tags: ['fun', 'outdoor'], desc: 'Six bands, a food court and a sponsor zone.', includes: ['Stage and sound', 'Volunteer crew and security', 'Sponsor booths', 'Basic lighting'], tip: 'Sponsors usually cover 30 to 50 percent of a campus fest.' }),
  // Other
  T({ type: 'Other', title: 'Charity Gala Dinner', theme: 'Auction and dinner', venue: 'Banquet hall', perGuest: 70, minGuests: 50, maxGuests: 300, defaultGuests: 150, time: '19:00', dow: 6, leadWeeks: 12, tags: ['formal', 'grand'], desc: 'Short talks, a live auction and a three-course dinner.', includes: ['Banquet hall with stage', 'Three-course dinner', 'Auction setup and MC', 'Donation desk'], tip: 'Collect auction items 6 weeks ahead.' }),
  T({ type: 'Other', title: 'Family Reunion Lunch', theme: 'Relaxed and casual', venue: 'Garden restaurant or resort', perGuest: 22, minGuests: 20, maxGuests: 150, defaultGuests: 60, time: '12:30', dow: 5, leadWeeks: 4, tags: ['outdoor', 'fun', 'intimate'], desc: 'A long lunch, a kids corner and a family photo.', includes: ['Reserved garden area', 'Buffet lunch', 'Kids corner', 'Family photo session'], tip: 'Share the date 2 months early so relatives can travel.' })
];

const VIBE_FACTOR: Record<string, number> = { Luxury: 1.5, Elegant: 1.2, Minimal: 0.85, Outdoor: 1, 'Fun & colourful': 1 };
const VIBE_TAG: Record<string, string> = { Luxury: 'grand', Elegant: 'formal', Minimal: 'intimate', Outdoor: 'outdoor', 'Fun & colourful': 'fun' };

function nextWeekday(daysAhead: number, dow: number): string {
  const d = today();
  d.setDate(d.getDate() + daysAhead);
  d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
  return iso(d);
}

type Fit = 'great' | 'tight' | 'resized';

export function suggestions(p: Preferences) {
  const wanted = (p.types || []).filter(t => CATALOG.some(c => c.type === t));
  const pool = wanted.length ? CATALOG.filter(c => wanted.includes(c.type)) : CATALOG.filter(c => c.type !== 'Other');
  const factor = VIBE_FACTOR[p.vibe || ''] ?? 1;
  const vibeTag = VIBE_TAG[p.vibe || ''];
  const max = p.budgetMax && p.budgetMax > 0 ? p.budgetMax : 0;
  const min = p.budgetMin && p.budgetMin > 0 ? p.budgetMin : 0;

  const out: (Record<string, unknown> & { score: number; type: string })[] = [];

  for (const t of pool) {
    if (p.guests && (p.guests < t.minGuests || p.guests > t.maxGuests)) continue;   // wrong size for this format
    const unit = t.perGuest * factor * config.costScale;
    let guests = p.guests && p.guests > 0 ? p.guests : t.defaultGuests;
    let cost = Math.round((guests * unit) / 50) * 50;
    let budget = cost;
    let fit: Fit = 'great';
    const why: string[] = [];
    let fitNote = '';

    if (max && cost > max) {
      if (cost <= max * 1.12) {
        budget = Math.round(max / 50) * 50; fit = 'tight';
        fitNote = `Usually about ${money(cost)}. Doable at ${money(budget)} if decoration is kept simple.`;
      } else {
        const g = Math.floor(max / unit);
        if (g < t.minGuests || g < guests * 0.5) continue;                           // not realistic, so do not suggest it
        guests = g; cost = Math.round((g * unit) / 50) * 50; budget = cost; fit = 'resized';
        fitNote = `Sized to ${g} guests so it stays within ${money(max)}.`;
      }
    } else if (min && cost < min) {
      budget = Math.round(min / 50) * 50;
      fitNote = `Your extra budget goes into upgrades: better food, decoration and sound.`;
    } else if (max) fitNote = `Comfortably within ${money(max)}.`;

    let score = 50 + (fit === 'great' ? 20 : fit === 'tight' ? 8 : 0);
    if (wanted.includes(t.type)) { score += 12; why.push(`You like ${t.type.toLowerCase()} events.`); }
    if (vibeTag && t.tags.includes(vibeTag)) { score += 14; why.push(`Matches your ${p.vibe} style.`); }
    if (p.guests) why.push(`Right size for ${p.guests} guests.`);
    if (!why.length) why.push('A popular format at this size.');

    const alloc = budgetSplit({ type: t.type, guests, date: '', budget }).allocation;
    out.push({
      score, type: t.type, title: t.title, theme: t.theme, guests, budget,
      perGuest: guests ? Math.round(budget / guests) : 0,
      venue: p.city ? `${t.venue}, ${p.city}` : t.venue,
      date: nextWeekday(t.leadWeeks * 7, t.dow), time: t.time, leadWeeks: t.leadWeeks,
      description: t.desc, includes: t.includes, tip: t.tip, fit, fitNote, why, breakdown: alloc
    });
  }

  // best first, but no more than 2 per type so the list stays varied
  out.sort((a, b) => b.score - a.score);
  const seen: Record<string, number> = {};
  const picked = out.filter(s => { seen[s.type] = (seen[s.type] || 0) + 1; return seen[s.type] <= 2; }).slice(0, 6);

  let note = '';
  if (!picked.length) {
    const cheapest = pool.length ? Math.min(...pool.map(t => Math.round(t.minGuests * t.perGuest * factor * config.costScale))) : 0;
    note = max && cheapest && max < cheapest
      ? `With ${money(max)} we could not build a realistic event of this kind. The smallest ones start around ${money(cheapest)}.`
      : 'Nothing fits those exact numbers. Try a different guest count or widen your budget.';
  }
  return { suggestions: picked.map(({ score, ...rest }) => rest), note };
}
