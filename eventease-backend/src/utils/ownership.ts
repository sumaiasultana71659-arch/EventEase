import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';

// An organizer may only touch his own events
export async function getOwnedEvent(userId: string, eventId: string) {
  const ev = await prisma.event.findFirst({ where: { id: eventId, ownerId: userId } });
  if (!ev) throw new HttpError(404, 'Event not found');
  return ev;
}
