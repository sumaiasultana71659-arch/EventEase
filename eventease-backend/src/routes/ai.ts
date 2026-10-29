import { Router } from 'express';
import { z } from 'zod';
import { wrap } from '../utils/asyncHandler';
import { prisma } from '../prisma';
import * as ai from '../services/ai';

const router = Router();

const inputSchema = z.object({
  type: z.string().min(1),
  guests: z.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().optional(),
  budget: z.number().min(0)
});

// POST /api/ai/plan | budget | tasks | schedule
router.post('/plan', wrap(async (req, res) => { res.json(ai.plan(inputSchema.parse(req.body))); }));
router.post('/budget', wrap(async (req, res) => { res.json(ai.budgetSplit(inputSchema.parse(req.body))); }));
router.post('/tasks', wrap(async (req, res) => { res.json(ai.tasks(inputSchema.parse(req.body))); }));
router.post('/schedule', wrap(async (req, res) => { res.json(ai.schedule(inputSchema.parse(req.body))); }));

// POST /api/ai/suggestions  {budgetMin?, budgetMax?, guests?, types?, city?, vibe?}
// Anything not sent falls back to the preferences saved on the user.
const prefsSchema = z.object({
  budgetMin: z.number().min(0).nullish(), budgetMax: z.number().min(0).nullish(), guests: z.number().int().min(1).nullish(),
  types: z.array(z.string()).optional(), city: z.string().nullish(), vibe: z.string().nullish()
});
router.post('/suggestions', wrap(async (req, res) => {
  const body = prefsSchema.parse(req.body || {});
  const u = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const saved: ai.Preferences = {
    budgetMin: u.prefBudgetMin, budgetMax: u.prefBudgetMax, guests: u.prefGuests,
    types: u.prefTypes ? u.prefTypes.split(',').filter(Boolean) : [], city: u.prefCity, vibe: u.prefVibe
  };
  const pick = <K extends keyof ai.Preferences>(k: K) => (body[k] !== undefined ? body[k] : saved[k]) as ai.Preferences[K];
  res.json(ai.suggestions({
    budgetMin: pick('budgetMin'), budgetMax: pick('budgetMax'), guests: pick('guests'),
    types: pick('types'), city: pick('city'), vibe: pick('vibe')
  }));
}));

export default router;
