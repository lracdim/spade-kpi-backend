import { Router } from 'express';
import {
    getAllEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation
} from '../controllers/evaluationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAllEvaluations);
router.get('/:id', authenticate, getEvaluationById);
router.post('/', authenticate, createEvaluation);
router.put('/:id', authenticate, updateEvaluation);
router.delete('/:id', authenticate, deleteEvaluation);

export default router;
