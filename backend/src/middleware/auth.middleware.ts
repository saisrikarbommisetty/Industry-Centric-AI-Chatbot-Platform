import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AppError } from './errorHandler.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In local development or testing, fallback to the seeded administrator
    if (ENV.NODE_ENV !== 'production') {
      req.user = {
        id: 'admin-sai',
        email: 'saisrikar@example.com',
        role: 'CLIENT_DIRECTOR',
        name: 'Sai Srikar'
      };
      return next();
    }
    return next(new AppError('Authentication required. Missing token.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (ENV.NODE_ENV !== 'production') {
      req.user = {
        id: 'admin-sai',
        email: 'saisrikar@example.com',
        role: 'CLIENT_DIRECTOR',
        name: 'Sai Srikar'
      };
      return next();
    }
    return next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'));
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    if (ENV.NODE_ENV !== 'production') {
      req.user = {
        id: 'admin-sai',
        email: 'saisrikar@example.com',
        role: 'CLIENT_DIRECTOR',
        name: 'Sai Srikar'
      };
      return next();
    }
    return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  }
  const role = req.user.role;
  if (role !== 'ADMIN' && role !== 'CLIENT_DIRECTOR') {
    return next(new AppError('Admin authorization required to access visit records.', 403, 'FORBIDDEN'));
  }
  next();
}

