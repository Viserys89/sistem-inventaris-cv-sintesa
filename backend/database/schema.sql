-- ==========================================
-- CV SINTESA MANDIRI KARYA
-- DATABASE SCHEMA
-- PostgreSQL 19
-- ==========================================

BEGIN;


-- 1. ROLES
CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);


-- 2. USERS
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- 3. CATEGORIES
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);


-- 4. ITEMS
CREATE TABLE items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    unit VARCHAR(30) NOT NULL,
    min_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    current_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
    purchase_price NUMERIC(15,2),
    selling_price NUMERIC(15,2),
    photo TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT check_min_stock CHECK (min_stock >= 0),
    CONSTRAINT check_current_stock CHECK (current_stock >= 0),
    CONSTRAINT check_purchase_price
        CHECK (purchase_price IS NULL OR purchase_price >= 0),
    CONSTRAINT check_selling_price
        CHECK (selling_price IS NULL OR selling_price >= 0)
);


-- 5. SUPPLIERS
CREATE TABLE suppliers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact VARCHAR(50),
    address TEXT
);


-- 6. PROJECTS
CREATE TABLE projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_code VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(150) NOT NULL,
    customer_name VARCHAR(150),
    project_type VARCHAR(100),
    project_date DATE,
    status VARCHAR(50) DEFAULT 'ongoing',
    notes TEXT
);


-- 7. TRANSACTIONS
CREATE TABLE transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaction_code VARCHAR(60) NOT NULL UNIQUE,
    transaction_date TIMESTAMPTZ NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,

    supplier_id BIGINT REFERENCES suppliers(id),
    reference TEXT,

    user_id BIGINT NOT NULL REFERENCES users(id),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_transaction_type CHECK (
        transaction_type IN (
            'OPENING_BALANCE',
            'IN_PURCHASE',
            'IN_PRODUCTION',
            'IN_RETURN',
            'ADJUSTMENT_IN',
            'OUT_PROJECT',
            'OUT_PRODUCTION',
            'OUT_SALE',
            'OUT_DAMAGED',
            'OUT_LOST',
            'ADJUSTMENT_OUT'
        )
    )
);


-- 8. TRANSACTION DETAILS
CREATE TABLE transaction_details (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    transaction_id BIGINT NOT NULL
        REFERENCES transactions(id),

    item_id BIGINT NOT NULL
        REFERENCES items(id),

    quantity NUMERIC(14,3) NOT NULL,

    unit_price NUMERIC(15,2),

    project_id BIGINT
        REFERENCES projects(id),

    CONSTRAINT check_quantity CHECK (quantity > 0)
);


-- 9. STOCK ADJUSTMENTS
CREATE TABLE stock_adjustments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    item_id BIGINT NOT NULL
        REFERENCES items(id),

    transaction_id BIGINT NOT NULL UNIQUE
        REFERENCES transactions(id),

    system_stock NUMERIC(14,3) NOT NULL,
    physical_stock NUMERIC(14,3) NOT NULL,

    difference NUMERIC(14,3)
        GENERATED ALWAYS AS (
            physical_stock - system_stock
        ) STORED,

    reason TEXT NOT NULL,

    adjustment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
);


-- 10. PRODUCTS
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    item_id BIGINT NOT NULL UNIQUE
        REFERENCES items(id),

    product_name VARCHAR(150) NOT NULL,
    description TEXT,
    specification TEXT,
    price NUMERIC(15,2),

    availability_status VARCHAR(50),
    is_published BOOLEAN DEFAULT FALSE
);


-- 11. ACTIVITY LOGS
CREATE TABLE activity_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id),

    activity VARCHAR(150) NOT NULL,
    entity VARCHAR(100),
    entity_id BIGINT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_items_category
ON items(category_id);

CREATE INDEX idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX idx_transactions_type
ON transactions(transaction_type);

CREATE INDEX idx_transaction_details_item
ON transaction_details(item_id);

CREATE INDEX idx_transaction_details_project
ON transaction_details(project_id);

CREATE INDEX idx_activity_logs_user
ON activity_logs(user_id);


-- ==========================================
-- INITIAL ROLES
-- ==========================================

INSERT INTO roles (role_name)
VALUES
    ('owner'),
    ('staff_admin');


COMMIT;