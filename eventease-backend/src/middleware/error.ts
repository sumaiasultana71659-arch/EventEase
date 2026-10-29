import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'Route not found'));
}

// Every error ends here. The frontend reads { message } from the response.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join('.');
    return res.status(400).json({ message: field ? `${field}: ${issue.message}` : issue.message });
  }

  const code = (err as { code?: string })?.code;
  if (code === 'P2002') return res.status(400).json({ message: 'This value already exists' });

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}
