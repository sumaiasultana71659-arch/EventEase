// Guests, tasks, activities and expenses all work the same way, so one file builds all four.
//   nestedRouter('tasks')  ->  GET/POST    /api/events/:id/tasks
//   flatRouter('tasks')    ->  PUT/DELETE  /api/tasks/:id
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { wrap } from '../utils/asyncHandler';
import { serialize } from '../utils/serialize';
import { getOwnedEvent } from '../utils/ownership';

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');
const timeText = z.string().regex(/^\d{2}:\d{2}$/, 'Use the format HH:MM');

export type ResourceName = 'guests' | 'tasks' | 'activities' | 'expenses';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RESOURCES: Record<ResourceName, { model: 'guest' | 'task' | 'activity' | 'expense'; schema: z.ZodObject<any> }> = {
  guests: {
    model: 'guest',
    schema: z.object({
      name: z.string().trim().min(1, 'Guest name is required'),
      email: z.string().trim().email('Enter a valid email').transform(s => s.toLowerCase()),
      phone: z.string().optional(),
      rsvp: z.enum(['pending', 'accepted', 'declined']).optional(),
      attendance: z.enum(['pending', 'present', 'absent']).optional()
    })
  },
  tasks: {
    model: 'task',
    schema: z.object({
      title: z.string().trim().min(1, 'Task title is required'),
      deadline: dateText,
      priority: z.enum(['low', 'medium', 'high']).optional(),
      done: z.boolean().optional()
    })
  },
  activities: {
    model: 'activity',
    schema: z.object({
      title: z.string().trim().min(1, 'Title is required'),
      date: dateText,
      time: timeText,
      notes: z.string().optional()
    })
  },
  expenses: {
    model: 'expense',
    schema: z.object({
      title: z.string().trim().min(1, 'Describe the expense'),
      category: z.enum(['venue', 'food', 'decoration', 'transportation', 'misc']),
      amount: z.number().positive('Amount must be greater than 0'),
      date: dateText
    })
  }
};

// prisma.guest / prisma.task ... have the same methods, so we pick one by name
function delegate(name: ResourceName) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[RESOURCES[name].model];
}

// /api/events/:id/<name>
export function nestedRouter(name: ResourceName) {
  const router = Router({ mergeParams: true });
  const { schema } = RESOURCES[name];

  router.get('/', wrap(async (req, res) => {
    const ev = await getOwnedEvent(req.user!.id, req.params.id);
    const rows = await delegate(name).findMany({ where: { eventId: ev.id }, orderBy: { createdAt: 'asc' } });
    res.json(rows.map(serialize));
  }));

  router.post('/', wrap(async (req, res) => {
    const ev = await getOwnedEvent(req.user!.id, req.params.id);
    const data = schema.parse(req.body);
    const row = await delegate(name).create({ data: { ...data, eventId: ev.id } });
    res.status(201).json(serialize(row));
  }));

  return router;
}

// /api/<name>/:id
export function flatRouter(name: ResourceName) {
  const router = Router();
  const { schema } = RESOURCES[name];

  // find the row and make sure it belongs to an event of the logged-in organizer
  async function findMine(id: string, userId: string) {
    const row = await delegate(name).findUnique({ where: { id }, include: { event: { select: { ownerId: true } } } });
    if (!row || row.event.ownerId !== userId) throw new HttpError(404, 'Not found');
    return row;
  }

  router.put('/:id', wrap(async (req, res) => {
    await findMine(req.params.id, req.user!.id);
    const data = schema.partial().parse(req.body);
    const row = await delegate(name).update({ where: { id: req.params.id }, data });
    res.json(serialize(row));
  }));

  router.delete('/:id', wrap(async (req, res) => {
    await findMine(req.params.id, req.user!.id);
    await delegate(name).delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  }));

  return router;
}
