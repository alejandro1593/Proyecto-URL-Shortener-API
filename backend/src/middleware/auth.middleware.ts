import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret'
    ) as { userId: string; email: string };

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (_err) {
    return next(createError('Invalid or expired token', 401));
  }
};
