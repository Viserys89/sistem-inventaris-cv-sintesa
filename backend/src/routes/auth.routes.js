import express from 'express';
import { login } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Login
router.post('/login', login);

// Memeriksa sesi pengguna
router.get('/me', authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

export default router;