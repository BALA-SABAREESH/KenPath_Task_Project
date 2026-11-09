import { Router } from 'express';
import authRoutes from './auth.routes.js';
import readingRoutes from './reading.routes.js';
import reportRoutes from './report.routes.js';
import systemRoutes from './system.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/readings', readingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/system', systemRoutes);

export default apiRouter;
