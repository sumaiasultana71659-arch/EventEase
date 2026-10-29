import { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not catch errors thrown inside async functions. This wrapper sends them to the error middleware.
export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
