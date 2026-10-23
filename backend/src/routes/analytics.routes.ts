import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { validate } from '../middleware/validation.middleware';
import { analyticsEventSchema } from '../validators';

const router = Router();

router.post('/event', validate(analyticsEventSchema), (req, res, next) =>
  analyticsController.trackEvent(req, res, next)
);

router.post('/events', validate(analyticsEventSchema), (req, res, next) =>
  analyticsController.trackEvent(req, res, next)
);

export default router;
