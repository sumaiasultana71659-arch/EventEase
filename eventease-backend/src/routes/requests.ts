import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { wrap } from '../utils/asyncHandler';
import { serializeRequest } from '../utils/requests';

const router = Router();

export const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Conference', 'Concert', 'Other'] as const;

const requestSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required'),
  type: z.enum(EVENT_TYPES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use the format HH:MM'),
  venue: z.string().trim().min(1, 'Venue is required'),
  guests: z.number().int().min(1, 'Guests must be at least 1'),
  budget: z.number().min(0),
  description: z.string().optional(),
  source: z.enum(['custom', 'ai']).optional()
});

// GET /api/requests   (my requests, newest first)
router.get('/', wrap(async (req, res) => {
  const list = await prisma.eventRequest.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } });
  res.json(list.map(r => serializeRequest(r)));
}));

// POST /api/requests   -> status "pending" until an admin decides
router.post('/', wrap(async (req, res) => {
  const data = requestSchema.parse(req.body);
  const r = await prisma.eventRequest.create({ data: { ...data, userId: req.user!.id } });
  res.status(201).json(serializeRequest(r));
}));

// DELETE /api/requests/:id   (cancel; only while pending)
router.delete('/:id', wrap(async (req, res) => {
  const r = await prisma.eventRequest.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!r) throw new HttpError(404, 'Request not found');
  if (r.status !== 'pending') throw new HttpError(400, 'Only pending requests can be cancelled');
  await prisma.eventRequest.delete({ where: { id: r.id } });
  res.json({ message: 'Cancelled' });
}));

export default router;
