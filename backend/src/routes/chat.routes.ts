import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { validate } from '../middleware/validation.middleware';
import { chatMessageSchema, createSessionSchema } from '../validators';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public Visitor Chat Endpoints
router.post('/message', chatRateLimiter, validate(chatMessageSchema), (req, res, next) =>
  chatController.sendMessage(req, res, next)
);

router.post('/session', validate(createSessionSchema), (req, res, next) =>
  chatController.createSession(req, res, next)
);

router.get('/session/:sessionId', (req, res, next) =>
  chatController.getSession(req, res, next)
);

router.get('/session/:sessionId/messages', (req, res, next) =>
  chatController.getSessionMessages(req, res, next)
);

router.post('/session/:sessionId/reset', (req, res, next) =>
  chatController.resetSession(req, res, next)
);

// Protected Admin Chat History Endpoints
router.get('/project/:projectId/sessions', authenticate, requireAdmin, (req, res, next) =>
  chatController.getProjectSessions(req, res, next)
);

router.get('/sessions', authenticate, requireAdmin, (req, res, next) =>
  chatController.getProjectSessions(req, res, next)
);

export default router;
