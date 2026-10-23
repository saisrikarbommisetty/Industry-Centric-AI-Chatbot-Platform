import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { leadController } from '../controllers/lead.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { chatController } from '../controllers/chat.controller';
import knowledgeRoutes from './knowledge.routes';

const router = Router();

// Project CRUD
router.get('/', (req, res, next) => projectController.getProjects(req, res, next));
router.get('/:id', (req, res, next) => projectController.getProject(req, res, next));
router.post('/', (req, res, next) => projectController.createProject(req, res, next));
router.put('/:id', (req, res, next) => projectController.updateProject(req, res, next));
router.delete('/:id', (req, res, next) => projectController.deleteProject(req, res, next));

// Nested Project Resources
router.use('/:projectId/knowledge', knowledgeRoutes);
router.get('/:projectId/leads', (req, res, next) => leadController.getProjectLeads(req, res, next));
router.get('/:projectId/analytics', (req, res, next) => analyticsController.getAnalytics(req, res, next));
router.get('/:projectId/sessions', (req, res, next) => chatController.getProjectSessions(req, res, next));

export default router;
