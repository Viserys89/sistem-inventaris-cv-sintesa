import express from 'express';

import {
    getItems,
    getItemSummary,
    getItemCategories,
    createItem,
    updateItem,
    updateItemStatus,
} from '../controllers/items.controller.js';

import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Semua endpoint inventaris wajib login.
router.use(authenticateToken);

// Ringkasan dan kategori
router.get('/summary', getItemSummary);
router.get('/categories', getItemCategories);

// Data barang
router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.patch('/:id/status', updateItemStatus);

export default router;