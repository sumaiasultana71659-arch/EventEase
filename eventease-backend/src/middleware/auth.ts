import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma';
import { HttpError } from './error';
import { wrap } from '../utils/asyncHandler';

export function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpires as jwt.SignOptions['expiresIn']
  });
}

// Reads "Authorization: Bearer <token>", checks it, and puts the user in req.user
export const requireAuth = wrap(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Please log in again');

  let userId: string;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    userId = String(payload.sub);
  } catch {
    throw new HttpError(401, 'Please log in again');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, 'Please log in again');

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});

export const requireRole = (...roles: Array<'admin' | 'organizer' | 'guest'>) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role as 'admin' | 'organizer' | 'guest')) {
    return next(new HttpError(403, `Only ${roles.join(' / ')} can do this`));
  }
  next();
};
