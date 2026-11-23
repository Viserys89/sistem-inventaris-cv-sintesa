
import pool from '../config/db.js';

// Klasifikasi transaksi
const INBOUND_TYPES = [
    'OPENING_BALANCE',
    'IN_PURCHASE',
    'IN_PRODUCTION',
    'IN_RETURN',
    'ADJUSTMENT_IN',
];

const OUTBOUND_TYPES = [
    'OUT_PROJECT',
    'OUT_PRODUCTION',
    'OUT_SALE',
    'OUT_DAMAGED',
    'OUT_LOST',
    'ADJUSTMENT_OUT',
];

// ==========================================
// 1. DASHBOARD SUMMARY
// ==========================================

export const getSummary = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE is_active = TRUE
                ) AS total_items,

                COUNT(*) FILTER (
                    WHERE is_active = TRUE
                    AND min_stock > 0
                    AND current_stock <= min_stock
                ) AS low_stock,

                COALESCE((
                    SELECT SUM(td.quantity)
                    FROM transaction_details td
                    JOIN transactions t
                        ON t.id = td.transaction_id
                    WHERE t.transaction_type = ANY($1::text[])
                    AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
                    AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                ), 0) AS items_in,

                COALESCE((
                    SELECT SUM(td.quantity)
                    FROM transaction_details td
                    JOIN transactions t
                        ON t.id = td.transaction_id
                    WHERE t.transaction_type = ANY($2::text[])
                    AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
                    AND t.transaction_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                ), 0) AS items_out

            FROM items
        `, [INBOUND_TYPES, OUTBOUND_TYPES]);

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik dashboard.',
        });
    }
};

// ==========================================
// 2. STOCK MOVEMENT CHART
// ==========================================

export const getStockMovement = async (req, res) => {
    try {
        const { period = '7d' } = req.query;

        const periods = {
            '7d': {
                start: '6 days',
                interval: '1 day',
                unit: 'day',
            },
            '30d': {
                start: '29 days',
                interval: '1 day',
                unit: 'day',
            },
            '1y': {
                start: '11 months',
                interval: '1 month',
                unit: 'month',
            },
        };

        if (!periods[period]) {
            return res.status(400).json({
                success: false,
                message: 'Periode tidak valid.',
            });
        }

        const selected = periods[period];

        const result = await pool.query(`
            WITH date_series AS (
                SELECT generate_series(
                    DATE_TRUNC(
                        '${selected.unit}',
                        CURRENT_DATE - INTERVAL '${selected.start}'
                    ),
                    DATE_TRUNC('${selected.unit}', CURRENT_DATE),
                    INTERVAL '${selected.interval}'
                )::date AS date
            ),

            movement AS (
                SELECT
                    DATE_TRUNC(
                        '${selected.unit}',
                        t.transaction_date
                    )::date AS date,

                    COALESCE(SUM(td.quantity) FILTER (
                        WHERE t.transaction_type = ANY($1::text[])
                    ), 0) AS items_in,

                    COALESCE(SUM(td.quantity) FILTER (
                        WHERE t.transaction_type = ANY($2::text[])
                    ), 0) AS items_out

                FROM transactions t
                JOIN transaction_details td
                    ON td.transaction_id = t.id

                WHERE t.transaction_date >=
                    DATE_TRUNC(
                        '${selected.unit}',
                        CURRENT_DATE - INTERVAL '${selected.start}'
                    )

                GROUP BY 1
            )

            SELECT
                ds.date,
                TO_CHAR(ds.date, 'DD Mon') AS label,
                COALESCE(m.items_in, 0) AS items_in,
                COALESCE(m.items_out, 0) AS items_out

            FROM date_series ds
            LEFT JOIN movement m ON m.date = ds.date
            ORDER BY ds.date ASC
        `, [INBOUND_TYPES, OUTBOUND_TYPES]);

        return res.status(200).json({
            success: true,
            period,
            data: result.rows,
        });

    } catch (error) {
        console.error('Stock movement error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil grafik pergerakan stok.',
        });
    }
};

// ==========================================
// 3. LOW STOCK ITEMS
// ==========================================

export const getLowStock = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                i.id,
                i.code,
                i.name,
                i.current_stock,
                i.min_stock,
                i.unit,
                c.category_name,

                ROUND(
                    CASE
                        WHEN i.min_stock > 0
                        THEN (i.current_stock / i.min_stock) * 100
                        ELSE 100
                    END,
                    2
                ) AS stock_percentage

            FROM items i

            LEFT JOIN categories c
                ON c.id = i.category_id

            WHERE
                i.is_active = TRUE
                AND i.min_stock > 0
                AND i.current_stock <= i.min_stock

            ORDER BY
                i.current_stock / NULLIF(i.min_stock, 0) ASC

            LIMIT 10
        `);

        return res.status(200).json({
            success: true,
            total: result.rowCount,
            data: result.rows,
        });

    } catch (error) {
        console.error('Low stock error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data stok menipis.',
        });
    }
};

// ==========================================
// 4. RECENT TRANSACTIONS
// ==========================================

export const getRecentTransactions = async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 5, 1),
            50
        );

        const result = await pool.query(`
            SELECT
                t.id,
                t.transaction_code,
                t.transaction_date,
                t.transaction_type,

                i.id AS item_id,
                i.name AS item_name,
                i.code AS item_code,
                i.unit,

                td.quantity,

                CASE
                    WHEN t.transaction_type = ANY($2::text[])
                    THEN -td.quantity
                    ELSE td.quantity
                END AS signed_quantity,

                u.name AS user_name

            FROM transactions t

            JOIN transaction_details td
                ON td.transaction_id = t.id

            JOIN items i
                ON i.id = td.item_id

            JOIN users u
                ON u.id = t.user_id

            WHERE t.transaction_type = ANY($1::text[])
                OR t.transaction_type = ANY($2::text[])

            ORDER BY t.transaction_date DESC, td.id DESC

            LIMIT $3
        `, [INBOUND_TYPES, OUTBOUND_TYPES, limit]);

        return res.status(200).json({
            success: true,
            data: result.rows,
        });

    } catch (error) {
        console.error('Recent transactions error:', error);

        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil transaksi terbaru.',
        });
    }
};
