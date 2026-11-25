import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { leadController } from '../controllers/lead.controller';
import { analyticsController } from '../controllers/analytics.controller';
import { chatController } from '../controllers/chat.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import knowledgeRoutes from './knowledge.routes';

const router = Router();

// Public Bot Config (used by public chat preview and embedded widget)
router.get('/:id', (req, res, next) => projectController.getProject(req, res, next));

// Protected Admin / Dashboard Project CRUD
router.get('/', authenticate, requireAdmin, (req, res, next) => projectController.getProjects(req, res, next));
router.post('/', authenticate, requireAdmin, (req, res, next) => projectController.createProject(req, res, next));
router.put('/:id', authenticate, requireAdmin, (req, res, next) => projectController.updateProject(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => projectController.deleteProject(req, res, next));

// Protected Nested Project Resources
router.use('/:projectId/knowledge', authenticate, requireAdmin, knowledgeRoutes);
router.get('/:projectId/leads', authenticate, requireAdmin, (req, res, next) => leadController.getProjectLeads(req, res, next));
router.get('/:projectId/analytics', authenticate, requireAdmin, (req, res, next) => analyticsController.getAnalytics(req, res, next));
router.get('/:projectId/sessions', authenticate, requireAdmin, (req, res, next) => chatController.getProjectSessions(req, res, next));

export default router;
