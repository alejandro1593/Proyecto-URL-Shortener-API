import { Request, Response, NextFunction } from 'express';

// Wrapper para controladores async: captura errores y los pasa a next()
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};