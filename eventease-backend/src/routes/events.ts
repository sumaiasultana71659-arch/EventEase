import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { wrap } from '../utils/asyncHandler';
import { allocationData, eventStatsInclude, serializeEvent, serializeEventWithStats } from '../utils/serialize';
import { getOwnedEvent } from '../utils/ownership';
import { nestedRouter } from './resources';
import * as ai from '../services/ai';

const router = Router();
router.use(requireAuth, requireRole('organizer')); // every route below is organizer-only

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');
const num = z.number().min(0);

const eventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required'),
  type: z.enum(['Wedding', 'Birthday', 'Corporate', 'Conference', 'Concert', 'Other']),
  date: dateText,
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use the format HH:MM'),
  venue: z.string().trim().min(1, 'Venue is required'),
  guests: z.number().int().min(1),
  budget: num,
  description: z.string().optional(),
  organizerName: z.string().optional(),
  organizerPhone: z.string().optional(),
  allocation: z.object({
    venue: num.optional(), food: num.optional(), decoration: num.optional(),
    transportation: num.optional(), misc: num.optional()
  }).optional()
});

// GET /api/events
router.get('/', wrap(async (req, res) => {
  const events = await prisma.event.findMany({ where: { ownerId: req.user!.id }, orderBy: { date: 'asc' }, include: eventStatsInclude });
  res.json(events.map(serializeEventWithStats));
}));

// POST /api/events
router.post('/', wrap(async (req, res) => {
  const { allocation, ...rest } = eventSchema.parse(req.body);
  const ev = await prisma.event.create({ data: { ...rest, ...allocationData(allocation), ownerId: req.user!.id } });
  res.status(201).json(serializeEvent(ev));
}));

// GET /api/events/:id/ai-summary  (must be before /:id routes that could swallow it)
router.get('/:id/ai-summary', wrap(async (req, res) => {
  const ev = await getOwnedEvent(req.user!.id, req.params.id);
  const where = { eventId: ev.id };
  const [guests, tasks, expenses, activities] = await Promise.all([
    prisma.guest.findMany({ where }), prisma.task.findMany({ where }),
    prisma.expense.findMany({ where }), prisma.activity.findMany({ where })
  ]);
  res.json(ai.summary({ event: ev, guests, tasks, expenses, activities }));
}));

// GET /api/events/:id
router.get('/:id', wrap(async (req, res) => {
  res.json(serializeEvent(await getOwnedEvent(req.user!.id, req.params.id)));
}));

// PUT /api/events/:id   (any subset of fields)
router.put('/:id', wrap(async (req, res) => {
  await getOwnedEvent(req.user!.id, req.params.id);
  const { allocation, ...rest } = eventSchema.partial().parse(req.body);
  const ev = await prisma.event.update({ where: { id: req.params.id }, data: { ...rest, ...allocationData(allocation) } });
  res.json(serializeEvent(ev));
}));

// DELETE /api/events/:id   (guests, tasks, activities, expenses are deleted with it)
router.delete('/:id', wrap(async (req, res) => {
  await getOwnedEvent(req.user!.id, req.params.id);
  await prisma.event.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
}));

// GET/POST /api/events/:id/guests | tasks | activities | expenses
router.use('/:id/guests', nestedRouter('guests'));
router.use('/:id/tasks', nestedRouter('tasks'));
router.use('/:id/activities', nestedRouter('activities'));
router.use('/:id/expenses', nestedRouter('expenses'));

export default router;
