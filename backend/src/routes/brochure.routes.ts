import { Router } from 'express';
import { brochureController } from '../controllers/brochure.controller';

const router = Router();

// Endpoint for generating brochure via POST payload
router.post('/generate', (req, res, next) =>
  brochureController.generateBrochure(req, res, next)
);

// Endpoint for downloading brochure via GET query params
router.get('/download', (req, res, next) =>
  brochureController.downloadBrochure(req, res, next)
);

export default router;
