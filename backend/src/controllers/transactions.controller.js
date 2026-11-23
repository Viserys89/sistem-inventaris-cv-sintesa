import pool from "../config/db.js";
import { randomUUID } from "crypto";
// ==========================================
// GET DAFTAR TRANSAKSI
// ==========================================

export const getTransactions = async (req, res) => {
  try {
    const {
      search = "",
      type = "",
      start_date = "",
      end_date = "",
      page = 1,
      limit = 7,
    } = req.query;

    const searchTerm =
      typeof search === "string" ? search.trim() : "";

    const txType =
      typeof type === "string" ? type.trim().toUpperCase() : "";

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 7));
    const offset = (currentPage - 1) * pageLimit;

    const conditions = [];
    const values = [];

    // Filter pencarian
    if (searchTerm) {
      values.push(`%${searchTerm}%`);
      const paramIndex = values.length;

      conditions.push(`
        (
          t.transaction_code ILIKE $${paramIndex}
          OR t.reference ILIKE $${paramIndex}
          OR i.name ILIKE $${paramIndex}
          OR i.code ILIKE $${paramIndex}
        )
      `);
    }

    // Filter jenis transaksi
    if (txType === "IN") {
      conditions.push(`
        t.transaction_type IN (
          'OPENING_BALANCE',
          'IN_PURCHASE',
          'IN_PRODUCTION',
          'IN_RETURN',
          'ADJUSTMENT_IN'
        )
      `);
    } else if (txType === "OUT") {
      conditions.push(`
        t.transaction_type IN (
          'OUT_PROJECT',
          'OUT_PRODUCTION',
          'OUT_SALE',
          'OUT_DAMAGED',
          'OUT_LOST',
          'ADJUSTMENT_OUT'
        )
      `);
    } else if (txType === "ADJUSTMENT") {
      conditions.push(`
        t.transaction_type IN (
          'ADJUSTMENT_IN',
          'ADJUSTMENT_OUT'
        )
      `);
    }

    // Filter tanggal mulai
    if (start_date) {
      values.push(start_date);

      conditions.push(
        `t.transaction_date >= $${values.length}::date`
      );
    }

    // Filter tanggal akhir
    if (end_date) {
      values.push(end_date);

      conditions.push(
        `t.transaction_date < ($${values.length}::date + INTERVAL '1 day')`
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Menghitung jumlah transaksi
    const countResult = await pool.query(
      `
        SELECT COUNT(DISTINCT t.id)::int AS total

        FROM transactions t

        LEFT JOIN transaction_details td
          ON td.transaction_id = t.id

        LEFT JOIN items i
          ON i.id = td.item_id

        ${whereClause}
      `,
      values
    );

    const totalItems = countResult.rows[0]?.total ?? 0;

    // Menyiapkan pagination
    const dataValues = [...values];

    dataValues.push(pageLimit);
    const limitPosition = dataValues.length;

    dataValues.push(offset);
    const offsetPosition = dataValues.length;

    // Mengambil daftar transaksi
    const result = await pool.query(
      `
        SELECT
          t.id,
          t.transaction_code,
          t.transaction_date,
          t.transaction_type,
          t.reference,
          t.notes,
          u.name AS recorded_by,

          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'item_id', i2.id,
                  'item_code', i2.code,
                  'item_name', i2.name,
                  'quantity', td2.quantity,
                  'unit', i2.unit
                )
              )

              FROM transaction_details td2

              JOIN items i2
                ON i2.id = td2.item_id

              WHERE td2.transaction_id = t.id
            ),
            '[]'::json
          ) AS items

        FROM transactions t

        LEFT JOIN users u
          ON u.id = t.user_id

        WHERE t.id IN (
          SELECT DISTINCT t.id

          FROM transactions t

          LEFT JOIN transaction_details td
            ON td.transaction_id = t.id

          LEFT JOIN items i
            ON i.id = td.item_id

          ${whereClause}
        )

        ORDER BY t.transaction_date DESC, t.id DESC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition}
      `,
      dataValues
    );

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage,
        limit: pageLimit,
        totalItems,
        totalPages: Math.ceil(totalItems / pageLimit),
      },
    });

  } catch (error) {
    console.error("Get transactions:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data transaksi.",
    });
  }
};


// ==========================================
// GET RINGKASAN TRANSAKSI BULANAN
// ==========================================

export const getTransactionSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentDate = new Date();

    const selectedMonth =
      month === undefined
        ? currentDate.getMonth() + 1
        : Number(month);

    const selectedYear =
      year === undefined
        ? currentDate.getFullYear()
        : Number(year);

    if (
      !Number.isInteger(selectedMonth) ||
      !Number.isInteger(selectedYear) ||
      selectedMonth < 1 ||
      selectedMonth > 12 ||
      selectedYear < 2000 ||
      selectedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Periode transaksi tidak valid.",
      });
    }

    // Mengambil ringkasan transaksi
    const result = await pool.query(
      `
        SELECT

          COUNT(*) FILTER (
            WHERE transaction_type IN (
              'OPENING_BALANCE',
              'IN_PURCHASE',
              'IN_PRODUCTION',
              'IN_RETURN'
            )
          )::int AS incoming_transactions,

          COUNT(*) FILTER (
            WHERE transaction_type IN (
              'OUT_PROJECT',
              'OUT_PRODUCTION',
              'OUT_SALE',
              'OUT_DAMAGED',
              'OUT_LOST'
            )
          )::int AS outgoing_transactions,

          COUNT(*) FILTER (
            WHERE transaction_type IN (
              'ADJUSTMENT_IN',
              'ADJUSTMENT_OUT'
            )
          )::int AS adjustment_transactions,

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type IN (
                  'OPENING_BALANCE',
                  'IN_PURCHASE',
                  'IN_PRODUCTION',
                  'IN_RETURN'
                )
                THEN total_quantity
                ELSE 0
              END
            ),
            0
          ) AS incoming_quantity,

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type IN (
                  'OUT_PROJECT',
                  'OUT_PRODUCTION',
                  'OUT_SALE',
                  'OUT_DAMAGED',
                  'OUT_LOST'
                )
                THEN total_quantity
                ELSE 0
              END
            ),
            0
          ) AS outgoing_quantity

        FROM (
          SELECT
            t.id,
            t.transaction_type,
            COALESCE(SUM(td.quantity), 0) AS total_quantity

          FROM transactions t

          LEFT JOIN transaction_details td
            ON td.transaction_id = t.id

          WHERE
            t.transaction_date >= make_date($1, $2, 1)

            AND t.transaction_date < (
              make_date($1, $2, 1) + INTERVAL '1 month'
            )

          GROUP BY
            t.id,
            t.transaction_type
        ) AS transaction_summary
      `,
      [selectedYear, selectedMonth]
    );

    // Menghitung jumlah barang yang memiliki selisih stok
    const adjustmentResult = await pool.query(
      `
        SELECT
          COUNT(DISTINCT sa.item_id)::int AS different_items

        FROM stock_adjustments sa

        WHERE
          sa.adjustment_date >= make_date($1, $2, 1)

          AND sa.adjustment_date < (
            make_date($1, $2, 1) + INTERVAL '1 month'
          )

          AND sa.difference <> 0
      `,
      [selectedYear, selectedMonth]
    );

    return res.json({
      success: true,

      period: {
        month: selectedMonth,
        year: selectedYear,
      },

      data: {
        ...result.rows[0],
        different_items: adjustmentResult.rows[0].different_items,
      },
    });

  } catch (error) {
    console.error("Get transaction summary:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil ringkasan transaksi.",
    });
  }
};
// ==========================================
// GET DETAIL TRANSAKSI
// ==========================================

export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi ID transaksi
    if (!/^\d+$/.test(id) || id === "0") {
      return res.status(400).json({
        success: false,
        message: "ID transaksi tidak valid.",
      });
    }

    const result = await pool.query(
      `
        SELECT
          t.id,
          t.transaction_code,
          t.transaction_date,
          t.transaction_type,
          t.reference,
          t.notes,
          t.created_at,

          u.id AS user_id,
          u.name AS recorded_by,
          u.username,

          s.id AS supplier_id,
          s.name AS supplier_name,
          s.contact AS supplier_contact,

          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'detail_id', td.id,
                  'item_id', i.id,
                  'item_code', i.code,
                  'item_name', i.name,
                  'quantity', td.quantity,
                  'unit', i.unit,
                  'unit_price', td.unit_price,
                  'subtotal',
                    COALESCE(td.quantity * td.unit_price, 0),
                  'project_id', p.id,
                  'project_code', p.project_code,
                  'project_name', p.project_name
                )
              )
              FROM transaction_details td
              JOIN items i
                ON i.id = td.item_id
              LEFT JOIN projects p
                ON p.id = td.project_id
              WHERE td.transaction_id = t.id
            ),
            '[]'::json
          ) AS items,

          (
            SELECT JSON_BUILD_OBJECT(
              'item_id', sa.item_id,
              'system_stock', sa.system_stock,
              'physical_stock', sa.physical_stock,
              'difference', sa.difference,
              'reason', sa.reason,
              'adjustment_date', sa.adjustment_date
            )
            FROM stock_adjustments sa
            WHERE sa.transaction_id = t.id
          ) AS adjustment

        FROM transactions t

        LEFT JOIN users u
          ON u.id = t.user_id

        LEFT JOIN suppliers s
          ON s.id = t.supplier_id

        WHERE t.id = $1
        LIMIT 1
      `,
      [id]
    );

    // Transaksi tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan.",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Get transaction detail:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail transaksi.",
    });
  }
};

// ==========================================
// CREATE TRANSAKSI BARANG MASUK
// ==========================================

export const createIncomingTransaction = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      transaction_type,
      transaction_date,
      supplier_id,
      reference,
      notes,
      items,
    } = req.body;

    // Validasi jenis transaksi
    const allowedTypes = [
      "OPENING_BALANCE",
      "IN_PURCHASE",
      "IN_PRODUCTION",
      "IN_RETURN",
    ];

    if (!allowedTypes.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: "Jenis transaksi barang masuk tidak valid.",
      });
    }

    // Validasi daftar barang
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal harus ada satu barang.",
      });
    }

    // Validasi setiap barang
    const itemIds = [];

    for (const item of items) {
      const itemId = Number(item.item_id);
      const quantity = Number(item.quantity);
      const unitPrice =
        item.unit_price === null || item.unit_price === undefined
          ? null
          : Number(item.unit_price);

      if (
        !Number.isSafeInteger(itemId) ||
        itemId <= 0 ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        (unitPrice !== null &&
          (!Number.isFinite(unitPrice) || unitPrice < 0))
      ) {
        return res.status(400).json({
          success: false,
          message: "Data barang atau kuantitas tidak valid.",
        });
      }

      itemIds.push(itemId);
    }

    // Mencegah barang yang sama dimasukkan dua kali
    if (new Set(itemIds).size !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Barang yang sama tidak boleh dimasukkan dua kali.",
      });
    }

    // Validasi tanggal
    const date = transaction_date || new Date().toISOString();

    if (Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: "Tanggal transaksi tidak valid.",
      });
    }

    // Mulai transaksi database
    await client.query("BEGIN");

    // Mengunci data barang agar tidak berubah bersamaan
    const lockedItems = await client.query(
      `
        SELECT id, code, name, current_stock
        FROM items
        WHERE id = ANY($1::bigint[])
          AND is_active = true
        ORDER BY id
        FOR UPDATE
      `,
      [itemIds]
    );

    if (lockedItems.rows.length !== itemIds.length) {
      throw new Error(
        "Salah satu barang tidak ditemukan atau sudah tidak aktif."
      );
    }

    // Membuat kode transaksi unik
    const transactionCode =
      `TRX-IN-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    // Menyimpan header transaksi
    const transactionResult = await client.query(
      `
        INSERT INTO transactions (
          transaction_code,
          transaction_date,
          transaction_type,
          supplier_id,
          reference,
          user_id,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, transaction_code
      `,
      [
        transactionCode,
        date,
        transaction_type,
        supplier_id || null,
        reference || null,
        req.user.id,
        notes || null,
      ]
    );

    const transaction = transactionResult.rows[0];

    // Menyimpan detail dan menambahkan stok
    for (const item of items) {
      const quantity = String(item.quantity);

      const unitPrice =
        item.unit_price === null || item.unit_price === undefined
          ? null
          : String(item.unit_price);

      await client.query(
        `
          INSERT INTO transaction_details (
            transaction_id,
            item_id,
            quantity,
            unit_price
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          transaction.id,
          item.item_id,
          quantity,
          unitPrice,
        ]
      );

      await client.query(
        `
          UPDATE items
          SET current_stock = current_stock + $1::numeric
          WHERE id = $2
        `,
        [quantity, item.item_id]
      );
    }

    // Menyelesaikan transaksi database
    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Transaksi barang masuk berhasil disimpan.",
      data: {
        id: transaction.id,
        transaction_code: transaction.transaction_code,
      },
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create incoming transaction:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Gagal menyimpan transaksi barang masuk.",
    });

  } finally {
    client.release();
  }
};

// ==========================================
// CREATE TRANSAKSI BARANG KELUAR
// ==========================================

export const createOutgoingTransaction = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const {
      transaction_type,
      transaction_date,
      reference,
      notes,
      items,
    } = req.body;

    // Validasi jenis transaksi
    const allowedTypes = [
      "OUT_PROJECT",
      "OUT_PRODUCTION",
      "OUT_SALE",
      "OUT_DAMAGED",
      "OUT_LOST",
    ];

    if (!allowedTypes.includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: "Jenis transaksi barang keluar tidak valid.",
      });
    }

    // Validasi daftar barang
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal harus ada satu barang.",
      });
    }

    const itemIds = [];

    for (const item of items) {
      const itemId = Number(item.item_id);
      const quantity = Number(item.quantity);

      const projectId =
        item.project_id === null ||
        item.project_id === undefined ||
        item.project_id === ""
          ? null
          : Number(item.project_id);

      const unitPrice =
        item.unit_price === null ||
        item.unit_price === undefined
          ? null
          : Number(item.unit_price);

      if (
        !Number.isSafeInteger(itemId) ||
        itemId <= 0 ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        (projectId !== null &&
          (!Number.isSafeInteger(projectId) || projectId <= 0)) ||
        (unitPrice !== null &&
          (!Number.isFinite(unitPrice) || unitPrice < 0))
      ) {
        return res.status(400).json({
          success: false,
          message: "Data barang atau kuantitas tidak valid.",
        });
      }

      if (
        transaction_type === "OUT_PROJECT" &&
        projectId === null
      ) {
        return res.status(400).json({
          success: false,
          message: "Proyek wajib dipilih untuk transaksi proyek.",
        });
      }

      itemIds.push(itemId);
    }

    // Mencegah duplikasi barang
    if (new Set(itemIds).size !== itemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Barang yang sama tidak boleh dimasukkan dua kali.",
      });
    }

    // Validasi tanggal
    const date = transaction_date || new Date().toISOString();

    if (Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: "Tanggal transaksi tidak valid.",
      });
    }

    // Mulai transaksi database
    await client.query("BEGIN");
    transactionStarted = true;

    // Mengunci data barang
    const lockedItems = await client.query(
      `
        SELECT id, code, name, current_stock
        FROM items
        WHERE id = ANY($1::bigint[])
          AND is_active = true
        ORDER BY id
        FOR UPDATE
      `,
      [itemIds]
    );

    if (lockedItems.rows.length !== itemIds.length) {
      throw new Error(
        "Salah satu barang tidak ditemukan atau sudah tidak aktif."
      );
    }

    // Membuat kode transaksi
    const transactionCode =
      `TRX-OUT-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    // Menyimpan header transaksi
    const transactionResult = await client.query(
      `
        INSERT INTO transactions (
          transaction_code,
          transaction_date,
          transaction_type,
          reference,
          user_id,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, transaction_code
      `,
      [
        transactionCode,
        date,
        transaction_type,
        reference || null,
        req.user.id,
        notes || null,
      ]
    );

    const transaction = transactionResult.rows[0];

    // Menyimpan detail dan mengurangi stok
    for (const item of items) {
      const quantity = String(item.quantity);

      const unitPrice =
        item.unit_price === null ||
        item.unit_price === undefined
          ? null
          : String(item.unit_price);

      const projectId =
        item.project_id === null ||
        item.project_id === undefined ||
        item.project_id === ""
          ? null
          : item.project_id;

      // Mengurangi stok dengan validasi stok tersedia
      const stockResult = await client.query(
        `
          UPDATE items
          SET current_stock = current_stock - $1::numeric
          WHERE id = $2
            AND current_stock >= $1::numeric
          RETURNING id
        `,
        [quantity, item.item_id]
      );

      if (stockResult.rowCount === 0) {
        const itemData = lockedItems.rows.find(
          (row) => Number(row.id) === Number(item.item_id)
        );

        const error = new Error(
          `Stok ${itemData?.name || "barang"} tidak mencukupi.`
        );

        error.statusCode = 409;
        throw error;
      }

      await client.query(
        `
          INSERT INTO transaction_details (
            transaction_id,
            item_id,
            quantity,
            unit_price,
            project_id
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          transaction.id,
          item.item_id,
          quantity,
          unitPrice,
          projectId,
        ]
      );
    }

    // Commit transaksi
    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Transaksi barang keluar berhasil disimpan.",
      data: {
        id: transaction.id,
        transaction_code: transaction.transaction_code,
      },
    });

  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Create outgoing transaction:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Gagal menyimpan transaksi barang keluar.",
    });

  } finally {
    client.release();
  }
};

export const createStockAdjustment = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Body request tidak ditemukan. Gunakan raw JSON.",
      });
    }

    const {
      item_id,
      physical_stock,
      reason,
      transaction_date,
      notes,
    } = req.body;

    const itemId = Number(item_id);
    const physicalStock = Number(physical_stock);

    if (
      !Number.isSafeInteger(itemId) ||
      itemId <= 0 ||
      !Number.isFinite(physicalStock) ||
      physicalStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID barang atau stok fisik tidak valid.",
      });
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Alasan penyesuaian wajib diisi.",
      });
    }

    const date = transaction_date || new Date().toISOString();

    if (Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: "Tanggal transaksi tidak valid.",
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const itemResult = await client.query(
      `
        SELECT id, code, name, current_stock
        FROM items
        WHERE id = $1
          AND is_active = true
        FOR UPDATE
      `,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      const error = new Error(
        "Barang tidak ditemukan atau sudah tidak aktif."
      );
      error.statusCode = 404;
      throw error;
    }

    const item = itemResult.rows[0];
    const systemStock = Number(item.current_stock);
    const difference = physicalStock - systemStock;

    if (difference === 0) {
      const error = new Error(
        "Stok fisik sama dengan stok sistem. Tidak perlu penyesuaian."
      );
      error.statusCode = 400;
      throw error;
    }

    const transactionType =
      difference > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";

    const transactionCode =
      `TRX-ADJ-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const transactionResult = await client.query(
      `
        INSERT INTO transactions (
          transaction_code,
          transaction_date,
          transaction_type,
          reference,
          user_id,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, transaction_code
      `,
      [
        transactionCode,
        date,
        transactionType,
        `Penyesuaian stok ${item.code}`,
        req.user.id,
        notes || null,
      ]
    );

    const transaction = transactionResult.rows[0];
    const absoluteDifference = Math.abs(difference);

    await client.query(
      `
        INSERT INTO transaction_details (
          transaction_id,
          item_id,
          quantity,
          unit_price,
          project_id
        )
        VALUES ($1, $2, $3, NULL, NULL)
      `,
      [
        transaction.id,
        itemId,
        String(absoluteDifference),
      ]
    );

   await client.query(
  `
    INSERT INTO stock_adjustments (
      item_id,
      transaction_id,
      system_stock,
      physical_stock,
      reason,
      adjustment_date,
      user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
  [
    itemId,
    transaction.id,
    String(systemStock),
    String(physicalStock),
    reason.trim(),
    date,
    req.user.id,
  ]
);

    await client.query(
      `
        UPDATE items
        SET current_stock = $1
        WHERE id = $2
      `,
      [String(physicalStock), itemId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Penyesuaian stok berhasil disimpan.",
      data: {
        id: transaction.id,
        transaction_code: transaction.transaction_code,
        item_name: item.name,
        system_stock: systemStock,
        physical_stock: physicalStock,
        difference,
        transaction_type: transactionType,
      },
    });

  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error("Create stock adjustment:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Gagal menyimpan penyesuaian stok.",
    });

  } finally {
    client.release();
  }
};