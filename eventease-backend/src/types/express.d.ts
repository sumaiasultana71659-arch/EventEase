// Tells TypeScript that req.user exists (it is filled by the requireAuth middleware)
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: 'admin' | 'organizer' | 'guest' };
    }
  }
}
export {};
