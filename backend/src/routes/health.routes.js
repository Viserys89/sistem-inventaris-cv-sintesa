import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW() AS database_time'
        );

        res.status(200).json({
            success: true,
            message: 'Backend dan database berhasil terhubung.',
            server: 'online',
            database: 'connected',
            databaseTime: result.rows[0].database_time,
        });

    } catch (error) {
        console.error('Health check error:', error);

        res.status(503).json({
            success: false,
            message: 'Database tidak dapat diakses.',
            server: 'online',
            database: 'disconnected',
        });
    }
});

export default router;