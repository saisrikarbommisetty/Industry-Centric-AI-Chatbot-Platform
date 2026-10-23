import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { validate } from '../middleware/validation.middleware';
import { leadCaptureSchema } from '../validators';

const router = Router();

router.post('/', validate(leadCaptureSchema), (req, res, next) =>
  leadController.createLead(req, res, next)
);

export default router;
