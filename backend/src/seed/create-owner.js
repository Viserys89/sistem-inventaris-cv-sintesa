import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const createOwner = async () => {
    try {
        const name = process.env.OWNER_NAME;
        const username = process.env.OWNER_USERNAME;
        const password = process.env.OWNER_PASSWORD;

        // Validasi konfigurasi
        if (!name || !username || !password) {
            throw new Error(
                'OWNER_NAME, OWNER_USERNAME, dan OWNER_PASSWORD wajib diisi di .env'
            );
        }

        if (password.length < 8) {
            throw new Error('Password minimal 8 karakter.');
        }

        // Pastikan role owner tersedia
        const roleResult = await pool.query(
            `SELECT id FROM roles WHERE role_name = 'owner'`
        );

        if (roleResult.rows.length === 0) {
            throw new Error('Role owner tidak ditemukan di database.');
        }

        const roleId = roleResult.rows[0].id;

        // Periksa apakah username sudah digunakan
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            throw new Error('Username sudah terdaftar.');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Simpan akun owner
        await pool.query(
            `INSERT INTO users (
                name,
                username,
                password_hash,
                role_id,
                is_active
            )
            VALUES ($1, $2, $3, $4, TRUE)`,
            [name, username, passwordHash, roleId]
        );

        console.log('================================');
        console.log('OWNER ACCOUNT CREATED');
        console.log('================================');
        console.log(`Name     : ${name}`);
        console.log(`Username : ${username}`);
        console.log('Password : [hidden]');
        console.log('Role     : owner');
        console.log('================================');

    } catch (error) {
        console.error('Failed to create owner:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

createOwner();