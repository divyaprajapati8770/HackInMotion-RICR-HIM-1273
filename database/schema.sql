-- ============================================================================
-- AI-Powered Inventory & Demand Forecasting System
-- MySQL Schema
-- ============================================================================

CREATE DATABASE IF NOT EXISTS inventory_forecasting
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE inventory_forecasting;

-- ----------------------------------------------------------------------------
-- users: business accounts. Every other table is scoped to a user_id so each
-- account's inventory / sales / forecasts stay private.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    business_name   VARCHAR(150)  NOT NULL,
    email           VARCHAR(190)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(30)   NOT NULL DEFAULT 'OWNER',
    enabled         BOOLEAN       NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(120) NULL,
    verification_token_expires_at TIMESTAMP NULL,
    auth_provider   VARCHAR(30)   NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_verification_token (verification_token)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- warehouses: supports the multi-location stretch goal from day one.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    name            VARCHAR(150)  NOT NULL,
    location        VARCHAR(255),
    is_default      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_warehouse_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- products: core inventory catalog
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT        NOT NULL,
    warehouse_id        BIGINT        NULL,
    sku                 VARCHAR(80)   NOT NULL,
    name                VARCHAR(200)  NOT NULL,
    category            VARCHAR(100)  NOT NULL,
    supplier_name       VARCHAR(150),
    supplier_lead_time_days INT       NOT NULL DEFAULT 7,
    unit_price          DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit_cost           DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_stock       INT           NOT NULL DEFAULT 0,
    reorder_point       INT           NOT NULL DEFAULT 10,
    safety_stock        INT           NOT NULL DEFAULT 5,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    UNIQUE KEY uq_user_sku (user_id, sku),
    INDEX idx_product_user_category (user_id, category)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- sales_records: historical sales, either CSV-uploaded or seeded for demo.
-- This is the data pipeline that feeds the forecasting engine.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    product_id      BIGINT        NOT NULL,
    sale_date       DATE          NOT NULL,
    units_sold      INT           NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
    revenue         DECIMAL(14,2) GENERATED ALWAYS AS (units_sold * unit_price) STORED,
    channel         VARCHAR(60)   DEFAULT 'default',
    source          VARCHAR(20)   NOT NULL DEFAULT 'CSV', -- CSV | SEED | MANUAL
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_sales_product_date (product_id, sale_date),
    INDEX idx_sales_user_date (user_id, sale_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- forecasts: stored output from the ML/forecasting engine per product.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forecasts (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT        NOT NULL,
    product_id              BIGINT        NOT NULL,
    generated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    horizon_days            INT           NOT NULL DEFAULT 30,
    method                  VARCHAR(60)   NOT NULL,          -- e.g. HOLT_WINTERS, MOVING_AVERAGE
    predicted_units_next_7  DECIMAL(10,2) NOT NULL DEFAULT 0,
    predicted_units_next_30 DECIMAL(10,2) NOT NULL DEFAULT 0,
    trend                   VARCHAR(20)   NOT NULL DEFAULT 'STABLE', -- UP | DOWN | STABLE
    trend_strength          DECIMAL(6,3)  NOT NULL DEFAULT 0,
    seasonality_index       DECIMAL(6,3)  NOT NULL DEFAULT 1,
    confidence              DECIMAL(5,2)  NOT NULL DEFAULT 0,
    daily_forecast_json     JSON          NULL,              -- [{date, predicted, lower, upper}]
    days_until_stockout     INT           NULL,
    recommended_reorder_qty INT           NOT NULL DEFAULT 0,
    recommended_reorder_by  DATE          NULL,
    CONSTRAINT fk_forecast_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_forecast_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_forecast_product_time (product_id, generated_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- alerts: actionable low-stock / overstock flags surfaced on the dashboard.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    product_id      BIGINT        NOT NULL,
    forecast_id     BIGINT        NULL,
    type            VARCHAR(30)   NOT NULL,   -- LOW_STOCK | OVERSTOCK | STOCKOUT_IMMINENT
    severity        VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH | CRITICAL
    message         VARCHAR(500)  NOT NULL,
    is_resolved     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP     NULL,
    CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_forecast FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE SET NULL,
    INDEX idx_alert_user_resolved (user_id, is_resolved)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- what_if_simulations: stored scenario runs for the "what-if" tool.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS what_if_simulations (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT        NOT NULL,
    product_id          BIGINT        NOT NULL,
    demand_change_pct   DECIMAL(6,2)  NOT NULL,
    lead_time_override  INT           NULL,
    result_json         JSON          NULL,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_whatif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_whatif_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- purchase_orders: supplier integration simulation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT        NOT NULL,
    product_id      BIGINT        NOT NULL,
    quantity        INT           NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'SIMULATED', -- SIMULATED | SENT | RECEIVED
    supplier_name   VARCHAR(150),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_arrival DATE,
    CONSTRAINT fk_po_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_po_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Seed a demo account + categories are inserted by the backend seeding
-- service (see SalesService#seedDemoData) so realistic trend/seasonality
-- patterns can be generated programmatically rather than hard-coded here.
-- ----------------------------------------------------------------------------
