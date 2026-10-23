import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const errorCode = err.code || (err.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected error occurred';

  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} ${errorCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(ENV.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
      ...(err.details ? { details: err.details } : {})
    }
  });
}
