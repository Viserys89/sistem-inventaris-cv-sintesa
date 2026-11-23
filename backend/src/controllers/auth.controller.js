import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
});

export const login = async (req, res) => {
    try {
        // Validasi input
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi.',
            });
        }

        const { username, password } = validation.data;

        // Cari pengguna berdasarkan username
        const result = await pool.query(
            `SELECT 
                users.id,
                users.name,
                users.username,
                users.password_hash,
                users.is_active,
                roles.role_name
             FROM users
             JOIN roles ON users.role_id = roles.id
             WHERE users.username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah.',
            });
        }

        const user = result.rows[0];

        // Periksa status akun
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Akun tidak aktif. Hubungi administrator.',
            });
        }

        // Periksa password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah.',
            });
        }

        // Buat JWT
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role_name,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h',
            }
        );

        // Kirim respons tanpa password
        return res.status(200).json({
            success: true,
            message: 'Login berhasil.',
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role_name,
            },
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.',
        });
    }
};