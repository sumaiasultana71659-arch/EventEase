// The React frontend expects "_id" (not "id"), no password, and "" instead of null.
// It also expects event.allocation = { venue, food, decoration, transportation, misc }.

const ALLOC_COLUMNS = {
  venue: 'allocVenue',
  food: 'allocFood',
  decoration: 'allocDecoration',
  transportation: 'allocTransportation',
  misc: 'allocMisc'
} as const;

export type Allocation = Partial<Record<keyof typeof ALLOC_COLUMNS, number>>;

export function serialize(row: object): Record<string, unknown> {
  const src = row as Record<string, unknown>;
  const out: Record<string, unknown> = { _id: src.id };
  for (const [key, value] of Object.entries(src)) {
    if (key === 'id' || key === 'createdAt' || key === 'password') continue;
    out[key] = value === null ? '' : value;
  }
  return out;
}

export function serializeEvent(ev: object): Record<string, unknown> {
  const src = ev as Record<string, unknown>;
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (key === 'ownerId' || key.startsWith('alloc')) continue;
    rest[key] = value;
  }
  const allocation: Record<string, unknown> = {};
  for (const [name, column] of Object.entries(ALLOC_COLUMNS)) allocation[name] = src[column] ?? 0;
  return { ...serialize(rest), allocation };
}

// { venue: 100 } -> { allocVenue: 100 }  (only the keys that were sent)
export function allocationData(allocation?: Allocation): Record<string, number> {
  const data: Record<string, number> = {};
  if (!allocation) return data;
  for (const [name, column] of Object.entries(ALLOC_COLUMNS)) {
    const v = allocation[name as keyof typeof ALLOC_COLUMNS];
    if (typeof v === 'number') data[column] = v;
  }
  return data;
}

// Event + small numbers for progress bars (used by the event lists)
interface EventWithRelations {
  tasks: { done: boolean }[];
  expenses: { amount: number }[];
  guestList: { rsvp: string }[];
}
export function serializeEventWithStats(ev: object): Record<string, unknown> {
  const { tasks, expenses, guestList, ...rest } = ev as EventWithRelations & Record<string, unknown>;
  return {
    ...serializeEvent(rest),
    stats: {
      tasksDone: tasks.filter(t => t.done).length,
      tasksTotal: tasks.length,
      spent: expenses.reduce((s, e) => s + e.amount, 0),
      guestsAdded: guestList.length,
      accepted: guestList.filter(g => g.rsvp === 'accepted').length
    }
  };
}
export const eventStatsInclude = {
  tasks: { select: { done: true } },
  expenses: { select: { amount: true } },
  guestList: { select: { rsvp: true } }
} as const;
