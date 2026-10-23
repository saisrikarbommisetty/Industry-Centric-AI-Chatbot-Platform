import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import projectRoutes from './project.routes';
import leadRoutes from './lead.routes';
import analyticsRoutes from './analytics.routes';
import visitRoutes from './visit.routes';
import brochureRoutes from './brochure.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/projects', projectRoutes);
router.use('/leads', leadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/visits', visitRoutes);
router.use('/brochures', brochureRoutes);

export default router;

