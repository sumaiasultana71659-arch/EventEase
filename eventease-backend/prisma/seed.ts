// Demo data = the same accounts/events the frontend mock used, so the
// "Fill organizer" / "Fill guest" buttons work with the real backend.
// Run:  npm run db:seed      (it does nothing if the demo organizer already exists)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/config';

const prisma = new PrismaClient();

function day(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function seedAdminAndRequests(password: string) {
  // the admin account comes from .env (ADMIN_EMAIL / ADMIN_PASSWORD or the defaults in src/config.ts)
  const adminPassword = await bcrypt.hash(config.adminPassword, 10);
  await prisma.user.upsert({
    where: { email: config.adminEmail },
    update: { password: adminPassword, role: 'admin' },
    create: { name: config.adminName, email: config.adminEmail, password: adminPassword, role: 'admin' }
  });
  console.log(`Admin ready: ${config.adminEmail}`);

  if ((await prisma.eventRequest.count()) > 0) return;

  const demo = await prisma.user.findUnique({ where: { email: 'organizer@eventease.com' } });
  if (demo) {
    await prisma.user.update({
      where: { id: demo.id },
      data: { prefBudgetMin: 3000, prefBudgetMax: 9000, prefGuests: 80, prefTypes: 'Corporate,Birthday', prefCity: 'Chattogram', prefVibe: 'Elegant' }
    });
  }
  const people = [
    { name: 'Ayesha Rahman', email: 'ayesha@mail.com', type: 'Wedding', title: 'Garden Wedding Reception', venue: 'Foy\'s Lake Resort, Chattogram', guests: 180, budget: 12000, off: 62, prefTypes: 'Wedding' },
    { name: 'Hasan Mahmud', email: 'hasan@mail.com', type: 'Concert', title: 'Campus Music Night', venue: 'Open-air arena, Chattogram', guests: 400, budget: 15000, off: 48, prefTypes: 'Concert' },
    { name: 'Tania Sultana', email: 'tania@mail.com', type: 'Birthday', title: 'Sweet 25 Rooftop Party', venue: 'Rooftop lounge, GEC Circle', guests: 45, budget: 1800, off: 33, prefTypes: 'Birthday' },
    { name: 'Rakib Chowdhury', email: 'rakib@mail.com', type: 'Conference', title: 'Startup Founders Summit', venue: 'Convention centre, Agrabad', guests: 250, budget: 9500, off: 75, prefTypes: 'Conference,Corporate' }
  ];
  for (const [i, p] of people.entries()) {
    const u = await prisma.user.upsert({
      where: { email: p.email }, update: {},
      create: { name: p.name, email: p.email, password, role: 'organizer', prefTypes: p.prefTypes, prefCity: 'Chattogram' }
    });
    await prisma.eventRequest.create({
      data: {
        userId: u.id, name: p.title, type: p.type, date: day(p.off), time: '18:00', venue: p.venue, guests: p.guests,
        budget: p.budget, source: i % 2 === 0 ? 'ai' : 'custom', description: 'Requested from the demo seed.',
        ...(i === 3 ? { status: 'rejected' as const, adminNote: 'Venue is already booked on that date. Please pick another date.', reviewedAt: new Date() } : {})
      }
    });
  }
  console.log('Demo users and event requests created.');
}

async function main() {
  const password = await bcrypt.hash('demo123', 10);
  if (await prisma.user.findUnique({ where: { email: 'organizer@eventease.com' } })) {
    await seedAdminAndRequests(password);
    console.log('Demo events already exist. Admin / requests checked.');
    return;
  }

  const organizer = await prisma.user.create({
    data: { name: 'Demo Organizer', email: 'organizer@eventease.com', password, role: 'organizer' }
  });
  await prisma.user.create({ data: { name: 'Demo Guest', email: 'guest@eventease.com', password, role: 'guest' } });

  const e1 = await prisma.event.create({
    data: {
      ownerId: organizer.id, name: 'Annual Company Dinner', type: 'Corporate', date: day(24), time: '19:00',
      venue: 'Grand Hall, City Center', guests: 120, budget: 8000,
      description: 'Yearly dinner to celebrate team achievements, with awards and live music.',
      organizerName: 'Demo Organizer', organizerPhone: '+880 1700 000000',
      allocVenue: 2800, allocFood: 2200, allocDecoration: 800, allocTransportation: 600, allocMisc: 1600
    }
  });
  await prisma.event.create({
    data: {
      ownerId: organizer.id, name: 'Product Launch Meetup', type: 'Conference', date: day(50), time: '10:00',
      venue: 'Tech Hub Auditorium', guests: 80, budget: 5000, description: 'Launch event with demos and networking.',
      organizerName: 'Demo Organizer', organizerPhone: '+880 1700 000000'
    }
  });

  const eventId = e1.id;
  const guest = (name: string, email: string, rsvp: 'pending' | 'accepted' | 'declined') => ({ eventId, name, email, rsvp });
  await prisma.guest.createMany({
    data: [
      guest('Demo Guest', 'guest@eventease.com', 'pending'), guest('Rafi Ahmed', 'rafi@mail.com', 'accepted'),
      guest('Nusrat Jahan', 'nusrat@mail.com', 'accepted'), guest('Tanvir Hasan', 'tanvir@mail.com', 'declined'),
      guest('Mim Akter', 'mim@mail.com', 'pending'), guest('Sabbir Khan', 'sabbir@mail.com', 'accepted'),
      guest('Farzana Islam', 'farzana@mail.com', 'accepted'), guest('Imran Hossain', 'imran@mail.com', 'pending')
    ]
  });

  const task = (title: string, deadline: string, done: boolean, priority: 'low' | 'medium' | 'high') => ({ eventId, title, deadline, done, priority });
  await prisma.task.createMany({
    data: [
      task('Confirm venue booking', day(-3), true, 'high'), task('Finalise the guest list', day(2), false, 'high'),
      task('Send invitations', day(5), false, 'high'), task('Confirm catering menu', day(9), false, 'medium'),
      task('Arrange transportation', day(14), false, 'medium'), task('Prepare agenda and speaker list', day(-1), false, 'medium'),
      task('Do a final venue walkthrough', day(23), false, 'low')
    ]
  });

  const act = (title: string, date: string, time: string, notes: string) => ({ eventId, title, date, time, notes });
  await prisma.activity.createMany({
    data: [
      act('Catering tasting', day(2), '15:00', 'At the caterer office'), act('Decoration vendor meeting', day(6), '11:00', ''),
      act('RSVP deadline', day(14), '23:00', ''), act('Rehearsal', day(23), '17:00', 'Check AV and stage'),
      act('Dinner starts', day(24), '19:00', 'Welcome drinks at 18:30')
    ]
  });

  const exp = (title: string, category: 'venue' | 'food' | 'decoration' | 'transportation' | 'misc', amount: number, date: string) => ({ eventId, title, category, amount, date });
  await prisma.expense.createMany({
    data: [
      exp('Venue deposit', 'venue', 1500, day(-10)), exp('Catering advance', 'food', 1200, day(-6)),
      exp('Stage and lighting', 'decoration', 450, day(-4)), exp('Shuttle bus booking', 'transportation', 300, day(-2)),
      exp('Printing and invitations', 'misc', 220, day(-1))
    ]
  });

  await seedAdminAndRequests(password);
  console.log('Demo data created: organizer@ / guest@eventease.com  (password: demo123). Admin login uses ADMIN_EMAIL / ADMIN_PASSWORD.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
