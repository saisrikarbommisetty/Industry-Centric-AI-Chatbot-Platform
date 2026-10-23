import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import apiRouter from './routes';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (ENV.CORS_ORIGINS.includes('*') || ENV.CORS_ORIGINS.some((o) => origin.startsWith(o.trim()))) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev to support various preview ports
      },
      credentials: true,
    })
  );

  // Body Parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging & Rate Limiting
  app.use(requestLogger);
  app.use('/api', generalRateLimiter);

  // Health Check Endpoint (Requirement #45)
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'industry-centric-ai-chatbot-backend',
      environment: ENV.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Root API Information & Documentation
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'Industry-Centric AI Chatbot Platform API',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: 'GET /health',
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          me: 'GET /api/auth/me',
        },
        chat: {
          message: 'POST /api/chat/message',
          session: 'POST /api/chat/session',
          getSession: 'GET /api/chat/session/:sessionId',
          reset: 'POST /api/chat/session/:sessionId/reset',
        },
        projects: {
          list: 'GET /api/projects',
          get: 'GET /api/projects/:id',
          knowledge: 'GET /api/projects/:projectId/knowledge',
          ingest: 'POST /api/projects/:projectId/knowledge/ingest',
          reindex: 'POST /api/projects/:projectId/knowledge/reindex',
          leads: 'GET /api/projects/:projectId/leads',
          analytics: 'GET /api/projects/:projectId/analytics',
        },
      },
    });
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
