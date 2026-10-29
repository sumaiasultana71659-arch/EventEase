import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler, notFound } from './middleware/error';
import { requireAuth, requireRole } from './middleware/auth';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import invitationRoutes from './routes/invitations';
import aiRoutes from './routes/ai';
import requestRoutes from './routes/requests';
import adminRoutes from './routes/admin';
import { flatRouter } from './routes/resources';

export const app = express();

app.use(cors({ origin: config.clientUrls }));
app.use(express.json());

const api = express.Router();
api.get('/health', (_req, res) => { res.json({ status: 'ok' }); });

api.use('/auth', authRoutes);
api.use('/events', eventRoutes);                       // + nested guests/tasks/activities/expenses
api.use('/my-invitations', requireAuth, requireRole('guest'), invitationRoutes);
api.use('/requests', requireAuth, requireRole('organizer'), requestRoutes);   // user -> admin event requests
api.use('/admin', requireAuth, requireRole('admin'), adminRoutes);
api.use('/ai', requireAuth, requireRole('organizer'), aiRoutes);

// PUT/DELETE /api/guests/:id  etc.
for (const name of ['guests', 'tasks', 'activities', 'expenses'] as const) {
  api.use('/' + name, requireAuth, requireRole('organizer'), flatRouter(name));
}

app.use('/api', api);
app.use(notFound);
app.use(errorHandler);
