import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledge.controller';
import { validate } from '../middleware/validation.middleware';
import { addKnowledgeSourceSchema } from '../validators';

const router = Router({ mergeParams: true });

router.post('/url', validate(addKnowledgeSourceSchema), (req, res, next) =>
  knowledgeController.addUrl(req, res, next)
);

router.post('/ingest', (req, res, next) =>
  knowledgeController.ingestWebsite(req, res, next)
);

router.post('/reindex', (req, res, next) =>
  knowledgeController.reindex(req, res, next)
);

router.get('/status', (req, res, next) =>
  knowledgeController.getStatus(req, res, next)
);

router.get('/', (req, res, next) =>
  knowledgeController.getSources(req, res, next)
);

router.get('/:id', (req, res, next) =>
  knowledgeController.getSource(req, res, next)
);

router.delete('/:id', (req, res, next) =>
  knowledgeController.deleteSource(req, res, next)
);

export default router;
