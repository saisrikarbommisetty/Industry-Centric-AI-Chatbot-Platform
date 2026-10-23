import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { validate } from '../middleware/validation.middleware';
import { chatMessageSchema, createSessionSchema } from '../validators';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

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

router.get('/project/:projectId/sessions', (req, res, next) =>
  chatController.getProjectSessions(req, res, next)
);

router.get('/sessions', (req, res, next) =>
  chatController.getProjectSessions(req, res, next)
);

router.post('/session/:sessionId/reset', (req, res, next) =>
  chatController.resetSession(req, res, next)
);

export default router;
