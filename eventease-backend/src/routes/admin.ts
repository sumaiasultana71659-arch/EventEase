import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { wrap } from '../utils/asyncHandler';
import { allocationData, eventStatsInclude, serializeEventWithStats } from '../utils/serialize';
import { serializeRequest } from '../utils/requests';
import * as ai from '../services/ai';

const router = Router(); // admin only (see app.ts)

const forUser = { user: { select: { id: true, name: true, email: true } } } as const;

// GET /api/admin/stats  -> numbers + small chart data for the admin dashboard
router.get('/stats', wrap(async (_req, res) => {
  const [users, events, requests] = await Promise.all([
    prisma.user.findMany({ select: { role: true } }),
    prisma.event.findMany({ select: { type: true, budget: true, guests: true } }),
    prisma.eventRequest.findMany({ include: forUser, orderBy: { createdAt: 'desc' } })
  ]);
  const count = (s: string) => requests.filter(r => r.status === s).length;

  // last 6 months: requests received vs approved
  const months: { month: string; requests: number; approved: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inMonth = requests.filter(r => r.createdAt.getFullYear() === d.getFullYear() && r.createdAt.getMonth() === d.getMonth());
    months.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      requests: inMonth.length,
      approved: inMonth.filter(r => r.status === 'approved').length
    });
  }

  const byType: Record<string, number> = {};
  events.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });

  res.json({
    totals: {
      users: users.filter(u => u.role === 'organizer').length,
      guests: users.filter(u => u.role === 'guest').length,
      events: events.length,
      pending: count('pending'), approved: count('approved'), rejected: count('rejected'),
      approvedBudget: events.reduce((s, e) => s + e.budget, 0),
      expectedGuests: events.reduce((s, e) => s + e.guests, 0)
    },
    months,
    byType: Object.entries(byType).map(([type, n]) => ({ type, count: n })).sort((a, b) => b.count - a.count),
    recent: requests.slice(0, 6).map(r => serializeRequest(r)),
    // oldest first: these are waiting longest
    pending: requests.filter(r => r.status === 'pending').reverse().slice(0, 5).map(r => serializeRequest(r))
  });
}));

// GET /api/admin/requests?status=pending|approved|rejected
router.get('/requests', wrap(async (req, res) => {
  const status = z.enum(['pending', 'approved', 'rejected']).optional().parse(req.query.status || undefined);
  const list = await prisma.eventRequest.findMany({
    where: status ? { status } : undefined, include: forUser, orderBy: { createdAt: 'desc' }
  });
  res.json(list.map(r => serializeRequest(r)));
}));

const approveSchema = z.object({
  // the admin may adjust the request before approving
  budget: z.number().min(0).optional(),
  venue: z.string().trim().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  note: z.string().optional()
});

// PUT /api/admin/requests/:id/approve
// Creates the real Event for the requester, with an AI budget split, starter tasks and a starter schedule.
router.put('/requests/:id/approve', wrap(async (req, res) => {
  const body = approveSchema.parse(req.body || {});
  const r = await prisma.eventRequest.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!r) throw new HttpError(404, 'Request not found');
  if (r.status !== 'pending') throw new HttpError(400, 'This request was already reviewed');

  const final = {
    budget: body.budget ?? r.budget, venue: body.venue ?? r.venue,
    date: body.date ?? r.date, time: body.time ?? r.time
  };
  const input = { type: r.type, guests: r.guests, date: final.date, time: final.time, budget: final.budget };
  const { allocation } = ai.budgetSplit(input);

  const updated = await prisma.$transaction(async tx => {
    const ev = await tx.event.create({
      data: {
        ownerId: r.userId, name: r.name, type: r.type, date: final.date, time: final.time, venue: final.venue,
        guests: r.guests, budget: final.budget, description: r.description, organizerName: r.user.name,
        ...allocationData(allocation)
      }
    });
    await tx.task.createMany({ data: ai.tasks(input).map(t => ({ ...t, eventId: ev.id })) });
    await tx.activity.createMany({ data: ai.schedule(input).map(a => ({ ...a, eventId: ev.id })) });
    return tx.eventRequest.update({
      where: { id: r.id },
      data: { status: 'approved', adminNote: body.note ?? null, eventId: ev.id, reviewedAt: new Date(), budget: final.budget, venue: final.venue, date: final.date, time: final.time },
      include: forUser
    });
  });
  res.json(serializeRequest(updated));
}));

// PUT /api/admin/requests/:id/reject  {note}
router.put('/requests/:id/reject', wrap(async (req, res) => {
  const { note } = z.object({ note: z.string().trim().min(1, 'Please write a short reason') }).parse(req.body);
  const r = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!r) throw new HttpError(404, 'Request not found');
  if (r.status !== 'pending') throw new HttpError(400, 'This request was already reviewed');
  const updated = await prisma.eventRequest.update({
    where: { id: r.id }, data: { status: 'rejected', adminNote: note, reviewedAt: new Date() }, include: forUser
  });
  res.json(serializeRequest(updated));
}));

// GET /api/admin/users
router.get('/users', wrap(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { events: true, requests: true } } }
  });
  res.json(users.map(u => ({
    _id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt,
    events: u._count.events, requests: u._count.requests
  })));
}));

// GET /api/admin/events   (every approved event, with the owner)
router.get('/events', wrap(async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { date: 'asc' }, include: { ...eventStatsInclude, owner: { select: { name: true, email: true } } }
  });
  res.json(events.map(e => {
    const { owner, ...rest } = e;
    return { ...serializeEventWithStats(rest), owner: { name: owner.name, email: owner.email } };
  }));
}));

// GET /api/admin/admins
router.get('/admins', wrap(async (_req, res) => {
  const admins = await prisma.user.findMany({ where: { role: 'admin' }, orderBy: { createdAt: 'asc' } });
  res.json(admins.map(a => ({ _id: a.id, name: a.name, email: a.email, createdAt: a.createdAt })));
}));

// POST /api/admin/admins  {name,email,password}  -> a new admin account
const adminSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email').transform(s => s.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters')
});
router.post('/admins', wrap(async (req, res) => {
  const data = adminSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: data.email } })) throw new HttpError(400, 'Email is already registered');
  const a = await prisma.user.create({ data: { name: data.name, email: data.email, password: await bcrypt.hash(data.password, 10), role: 'admin' } });
  res.status(201).json({ _id: a.id, name: a.name, email: a.email, createdAt: a.createdAt });
}));

export default router;
