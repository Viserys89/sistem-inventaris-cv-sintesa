import pool from "../config/db.js";
import { z } from "zod";

// ==========================================
// VALIDASI DATA BARANG
// ==========================================

const itemSchema = z.object({
  code: z.string().trim().min(1, "Kode barang wajib diisi"),
  name: z.string().trim().min(1, "Nama barang wajib diisi"),
  category_id: z.coerce.number().int().positive(),
  unit: z.string().trim().min(1, "Satuan wajib diisi"),
  min_stock: z.coerce.number().int().min(0),
  purchase_price: z.preprocess(
    (value) => (value === "" || value == null ? null : Number(value)),
    z.number().min(0).nullable().optional(),
  ),

  selling_price: z.preprocess(
    (value) => (value === "" || value == null ? null : Number(value)),
    z.number().min(0).nullable().optional(),
  ),
  photo: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

// ==========================================
// HELPER STATUS STOK
// ==========================================

function getStockStatus(item) {
  const stock = Number(item.current_stock);
  const minimum = Number(item.min_stock);

  if (stock === 0) return "habis";
  if (stock <= minimum) return "hampir_habis";

  return "tersedia";
}

// ==========================================
// GET RINGKASAN INVENTARIS
// ==========================================

export const getItemSummary = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT
                COUNT(*)::int AS total_items,
                COALESCE(SUM(current_stock), 0)::numeric
                    AS total_stock,
                COUNT(*) FILTER (
                    WHERE current_stock <= min_stock
                )::int AS low_stock
            FROM items
            WHERE is_active = TRUE
        `);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get item summary:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil ringkasan inventaris.",
    });
  }
};

// ==========================================
// GET DAFTAR KATEGORI
// ==========================================

export const getItemCategories = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT
                id,
                category_name
            FROM categories
            ORDER BY category_name ASC
        `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get categories:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil kategori barang.",
    });
  }
};

// ==========================================
// GET DAFTAR BARANG
// ==========================================

export const getItems = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      status = "",
      page = 1,
      limit = 6,
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 6));

    const offset = (currentPage - 1) * pageLimit;

    const conditions = [];
    const values = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);

      conditions.push(`
                (
                    i.code ILIKE $${values.length}
                    OR i.name ILIKE $${values.length}
                )
            `);
    }

    if (category) {
      values.push(Number(category));
      conditions.push(`i.category_id = $${values.length}`);
    }

    if (status === "nonaktif") {
      conditions.push("i.is_active = FALSE");
    } else {
      conditions.push("i.is_active = TRUE");

     if (status === "stok_rendah") {
  conditions.push("i.current_stock <= i.min_stock");
}

if (status === "habis") {
  conditions.push("i.current_stock = 0");
}

if (status === "hampir_habis") {
  conditions.push(`
    i.current_stock > 0
    AND i.current_stock <= i.min_stock
  `);
}

      if (status === "tersedia") {
        conditions.push("i.current_stock > i.min_stock");
      }
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Mengambil jumlah data

    const countResult = await pool.query(
      `
                SELECT COUNT(*)::int AS total
                FROM items i
                ${whereClause}
            `,
      values,
    );

    const totalItems = countResult.rows[0].total;

    // Mengambil data barang

    const dataValues = [...values];

    dataValues.push(pageLimit);
    const limitPosition = dataValues.length;

    dataValues.push(offset);
    const offsetPosition = dataValues.length;

    const result = await pool.query(
      `
                SELECT
                    i.id,
                    i.code,
                    i.name,
                    i.category_id,
                    c.category_name,
                    i.unit,
                    i.current_stock,
                    i.min_stock,
                    i.purchase_price,
                    i.selling_price,
                    i.photo,
                    i.description,
                    i.is_active
                FROM items i
                LEFT JOIN categories c
                    ON c.id = i.category_id
                ${whereClause}
                ORDER BY i.name ASC
                LIMIT $${limitPosition}
                OFFSET $${offsetPosition}
            `,
      dataValues,
    );

    const items = result.rows.map((item) => ({
      ...item,
      stock_status: item.is_active ? getStockStatus(item) : "nonaktif",
    }));

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage,
        limit: pageLimit,
        totalItems,
        totalPages: Math.ceil(totalItems / pageLimit),
      },
    });
  } catch (error) {
    console.error("Get items:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data barang.",
    });
  }
};

// ==========================================
// TAMBAH BARANG
// ==========================================

export const createItem = async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);

    const result = await pool.query(
      `
                INSERT INTO items (
                    code,
                    name,
                    category_id,
                    unit,
                    min_stock,
                    current_stock,
                    purchase_price,
                    selling_price,
                    photo,
                    description,
                    is_active
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    0, $6, $7, $8, $9, TRUE
                )
                RETURNING *
            `,
      [
        data.code,
        data.name,
        data.category_id,
        data.unit,
        data.min_stock,
        data.purchase_price ?? null,
        data.selling_price ?? null,
        data.photo ?? null,
        data.description ?? null,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Barang berhasil ditambahkan.",
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Kode barang sudah digunakan.",
      });
    }

if (error.code === '23503') {
    return res.status(400).json({
        success: false,
        message: 'Kategori barang tidak valid.',
    });
}

    console.error("Create item:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan barang.",
    });
  }
};

// ==========================================
// EDIT BARANG
// ==========================================

export const updateItem = async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);
    const { id } = req.params;

    const result = await pool.query(
      `
                UPDATE items
                SET
                    code = $1,
                    name = $2,
                    category_id = $3,
                    unit = $4,
                    min_stock = $5,
                    purchase_price = $6,
                    selling_price = $7,
                    photo = $8,
                    description = $9
                WHERE id = $10
                RETURNING *
            `,
      [
        data.code,
        data.name,
        data.category_id,
        data.unit,
        data.min_stock,
        data.purchase_price ?? null,
        data.selling_price ?? null,
        data.photo ?? null,
        data.description ?? null,
        id,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: "Data barang berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Kode barang sudah digunakan.",
      });
    }

    console.error("Update item:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui barang.",
    });
  }
};

// ==========================================
// AKTIFKAN / NONAKTIFKAN BARANG
// ==========================================

export const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status barang tidak valid.",
      });
    }

    const result = await pool.query(
      `
                UPDATE items
                SET is_active = $1
                WHERE id = $2
                RETURNING id, code, name, is_active
            `,
      [is_active, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: is_active
        ? "Barang berhasil diaktifkan."
        : "Barang berhasil dinonaktifkan.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update item status:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengubah status barang.",
    });
  }
};
