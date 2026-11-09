import { Router } from 'express';
import { SystemController } from '../controllers/system.controller.js';

const router = Router();

router.get('/status', SystemController.getStatus);
router.post('/configure-db', SystemController.testOrConfigureDatabase);

export default router;
