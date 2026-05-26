import express from 'express';
import { deleteAnalysis, getAnalysisById, getHistory } from '../controllers/historyController.js';

const router = express.Router();

router.get('/', getHistory);
router.get('/:id', getAnalysisById);
router.delete('/:id', deleteAnalysis);

export default router;
