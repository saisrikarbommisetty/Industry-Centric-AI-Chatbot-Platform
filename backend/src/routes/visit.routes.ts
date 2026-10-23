import { Router } from 'express';
import { visitController } from '../controllers/visit.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public Schedule Visit submission (chatbot)
router.post('/', (req, res, next) => visitController.createVisit(req, res, next));

// Admin-only endpoints for viewing and exporting visit requests
router.get('/', authenticate, requireAdmin, (req, res, next) =>
  visitController.getVisits(req, res, next)
);

router.get('/export', authenticate, requireAdmin, (req, res, next) =>
  visitController.exportVisitsToExcel(req, res, next)
);

export default router;
