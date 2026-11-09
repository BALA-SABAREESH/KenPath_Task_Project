import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        res.status(400).json({
          success: false,
          message: firstIssue.message,
          errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
        return;
      }
      res.status(400).json({ success: false, message: 'Invalid request data.' });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        res.status(400).json({
          success: false,
          message: firstIssue.message,
          errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
        return;
      }
      res.status(400).json({ success: false, message: 'Invalid query parameters.' });
    }
  };
};
