import { Router } from 'express';
import { getAllGuards, getGuardById, createGuard, deleteGuard } from '../controllers/guardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllGuards);
router.get('/:id', authenticate, getGuardById);
router.post('/', authenticate, createGuard);
router.delete('/:id', authenticate, deleteGuard);

export default router;
