import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// Limitador específico para creación de URLs (más estricto)
export const urlCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 URLs per hour per user
  message: 'URL creation limit reached. Please try again later.',
  keyGenerator: (req: Request) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para el endpoint de redirección
export const redirectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 redirects per minute
  message: 'Too many requests. Please try again later.',
  keyGenerator: (req: Request) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para login (previene fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login attempts per 15 min
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req: Request) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    });
  },
});
