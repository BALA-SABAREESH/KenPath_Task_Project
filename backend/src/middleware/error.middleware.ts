import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[API Error]:', err);

  // PostgreSQL unique violation error code 23505
  if (err.code === '23505') {
    if (err.detail && err.detail.includes('email')) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }
    if (err.constraint === 'uq_user_date_slot' || (err.message && err.message.includes('uq_user_date_slot'))) {
      res.status(409).json({
        success: false,
        message: 'You already have a reading for this time slot on this date.',
      });
      return;
    }
    res.status(409).json({
      success: false,
      message: 'A duplicate record already exists.',
    });
    return;
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    res.status(400).json({
      success: false,
      message: 'Value does not satisfy medical range constraints.',
    });
    return;
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};
