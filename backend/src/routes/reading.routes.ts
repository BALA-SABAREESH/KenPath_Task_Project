import { Router } from 'express';
import { ReadingController } from '../controllers/reading.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { readingInputSchema } from '../validators/reading.validator.js';

const router = Router();

// All reading endpoints require user authentication
router.use(authenticateToken);

router.post('/', validateBody(readingInputSchema), ReadingController.create);
router.get('/', ReadingController.getAll);
router.get('/:id', ReadingController.getById);
router.put('/:id', validateBody(readingInputSchema), ReadingController.update);
router.delete('/:id', ReadingController.delete);

export default router;
