
import express from 'express';

import {
    getSummary,
    getStockMovement,
    getLowStock,
    getRecentTransactions,
} from '../controllers/dashboard.controller.js';

import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Semua endpoint dashboard wajib menggunakan JWT
router.use(authenticateToken);

router.get('/summary', getSummary);
router.get('/stock-movement', getStockMovement);
router.get('/low-stock', getLowStock);
router.get('/recent-transactions', getRecentTransactions);

export default router;
