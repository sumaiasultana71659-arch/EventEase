// Guest role: the events I was invited to (matched by my login email)
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { wrap } from '../utils/asyncHandler';
import { serialize, serializeEvent } from '../utils/serialize';

const router = Router();

// GET /api/my-invitations -> [{ guest, event, activities }]
router.get('/', wrap(async (req, res) => {
  const rows = await prisma.guest.findMany({
    where: { email: req.user!.email },
    include: { event: { include: { activities: true } } }
  });
  res.json(rows.map(({ event, ...guest }) => {
    const { activities, ...ev } = event;
    const sorted = [...activities].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return { guest: serialize(guest), event: serializeEvent(ev), activities: sorted.map(serialize) };
  }));
}));

// PUT /api/my-invitations/:guestId/rsvp  {rsvp}
const rsvpSchema = z.object({ rsvp: z.enum(['pending', 'accepted', 'declined']) });

router.put('/:guestId/rsvp', wrap(async (req, res) => {
  const { rsvp } = rsvpSchema.parse(req.body);
  const guest = await prisma.guest.findFirst({ where: { id: req.params.guestId, email: req.user!.email } });
  if (!guest) throw new HttpError(404, 'Invitation not found');
  const updated = await prisma.guest.update({ where: { id: guest.id }, data: { rsvp } });
  res.json(serialize(updated));
}));

export default router;
