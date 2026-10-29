import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@prisma/client';
import { prisma } from '../prisma';
import { HttpError } from '../middleware/error';
import { requireAuth, signToken } from '../middleware/auth';
import { wrap } from '../utils/asyncHandler';
import { serialize } from '../utils/serialize';

const router = Router();

// What the frontend gets about a user (never the password hash)
export const publicUser = (u: User) => ({
  ...serialize({ id: u.id, name: u.name, email: u.email, role: u.role }),
  preferences: {
    budgetMin: u.prefBudgetMin ?? '',
    budgetMax: u.prefBudgetMax ?? '',
    guests: u.prefGuests ?? '',
    types: u.prefTypes ? u.prefTypes.split(',').filter(Boolean) : [],
    city: u.prefCity ?? '',
    vibe: u.prefVibe ?? ''
  }
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email').transform(s => s.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['organizer', 'guest']).optional()
});

const loginSchema = z.object({
  email: z.string().trim().transform(s => s.toLowerCase()),
  password: z.string()
});

// POST /api/auth/register  {name,email,password,role} -> {token,user}
router.post('/register', wrap(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new HttpError(400, 'Email is already registered');

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password: await bcrypt.hash(data.password, 10), role: data.role ?? 'organizer' }
  });
  res.status(201).json({ token: signToken(user.id, user.role), user: publicUser(user) });
}));

// POST /api/auth/login  {email,password} -> {token,user}
router.post('/login', wrap(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, 'Invalid email or password');
  // admins have their own page, so the public login never opens an admin account
  if (user.role === 'admin') throw new HttpError(403, 'Invalid email or password');
  res.json({ token: signToken(user.id, user.role), user: publicUser(user) });
}));

// POST /api/auth/admin-login  {email,password} -> {token,user}   (admin accounts only)
router.post('/admin-login', wrap(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'admin' || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, 'Invalid admin email or password');
  res.json({ token: signToken(user.id, user.role), user: publicUser(user) });
}));

// GET /api/auth/me
router.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json(publicUser(user));
}));

// PUT /api/auth/me  {name?, email?, password?}
const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email('Enter a valid email').transform(s => s.toLowerCase()).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  // "" from an empty form field means "not set"
  preferences: z.object({
    budgetMin: z.union([z.number().min(0), z.literal('')]).optional(),
    budgetMax: z.union([z.number().min(0), z.literal('')]).optional(),
    guests: z.union([z.number().int().min(1), z.literal('')]).optional(),
    types: z.array(z.string()).max(6).optional(),
    city: z.string().trim().max(80).optional(),
    vibe: z.string().trim().max(40).optional()
  }).optional()
});

function prefData(p?: z.infer<typeof updateSchema>['preferences']) {
  if (!p) return {};
  const n = (v: number | '' | undefined) => (v === undefined ? undefined : v === '' ? null : v);
  return {
    prefBudgetMin: n(p.budgetMin), prefBudgetMax: n(p.budgetMax), prefGuests: n(p.guests),
    prefTypes: p.types === undefined ? undefined : p.types.join(','),
    prefCity: p.city, prefVibe: p.vibe
  };
}

router.put('/me', requireAuth, wrap(async (req, res) => {
  const data = updateSchema.parse(req.body);
  if (data.email) {
    const other = await prisma.user.findUnique({ where: { email: data.email } });
    if (other && other.id !== req.user!.id) throw new HttpError(400, 'Email is already registered');
  }
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: data.name,
      email: data.email,
      password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
      ...prefData(data.preferences)
    }
  });
  res.json(publicUser(user));
}));

export default router;
