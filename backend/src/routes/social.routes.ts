import { Router } from 'express';
import { socialMediaController } from '../controllers/socialMedia.controller';
import { validate } from '../middleware/validation.middleware';
import { addSocialMediaSourceSchema } from '../validators';

const router = Router({ mergeParams: true });

// Platform detection from URL
router.post('/detect', (req, res, next) =>
  socialMediaController.detect(req, res, next)
);

// Preview post metadata before indexing
router.post('/preview', (req, res, next) =>
  socialMediaController.preview(req, res, next)
);

// Add new social media post source
router.post('/', validate(addSocialMediaSourceSchema), (req, res, next) =>
  socialMediaController.addSource(req, res, next)
);

// List social media sources for current project
router.get('/', (req, res, next) =>
  socialMediaController.listSources(req, res, next)
);

// Get live status of processing social media source
router.get('/:id/status', (req, res, next) =>
  socialMediaController.getStatus(req, res, next)
);

// Refresh a social media post (re-fetch, update embeddings)
router.post('/:id/refresh', (req, res, next) =>
  socialMediaController.refreshSource(req, res, next)
);

// Delete a social media source from knowledge base
router.delete('/:id', (req, res, next) =>
  socialMediaController.deleteSource(req, res, next)
);

export default router;
