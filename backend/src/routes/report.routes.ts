import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { reportDateQuerySchema } from '../validators/report.validator.js';

const router = Router();

// All report endpoints require user authentication
router.use(authenticateToken);

router.get('/daily', validateQuery(reportDateQuerySchema), ReportController.getDaily);
router.get('/month-to-date', validateQuery(reportDateQuerySchema), ReportController.getMonthToDate);
router.get('/monthly', validateQuery(reportDateQuerySchema), ReportController.getMonthly);

export default router;
