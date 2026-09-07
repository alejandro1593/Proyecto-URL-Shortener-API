import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { createError } from './errorHandler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err: any) {
      const errors = err.errors?.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(createError(JSON.stringify(errors), 400));
    }
  };
};
