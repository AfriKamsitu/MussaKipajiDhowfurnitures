-- Pajedhow audit remediation schema upgrade for an existing pre-audit database.
-- Review and back up the production database before applying this once.

ALTER TABLE users
    ADD COLUMN token_version BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN marketing_opt_in_at DATETIME(6) NULL;

ALTER TABLE products
    ADD COLUMN short_description VARCHAR(500) NULL,
    ADD COLUMN description TEXT NULL;

CREATE TABLE product_images (
    product_id BIGINT NOT NULL,
    image VARCHAR(1024) NULL,
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

ALTER TABLE orders
    ADD COLUMN idempotency_key VARCHAR(64) NULL;

CREATE UNIQUE INDEX idx_orders_customer_idempotency
    ON orders (customer_id, idempotency_key);

ALTER TABLE banners
    ADD COLUMN headline VARCHAR(255) NULL,
    ADD COLUMN description VARCHAR(1024) NULL,
    ADD COLUMN cta_label VARCHAR(255) NULL,
    ADD COLUMN price DECIMAL(14, 2) NULL,
    ADD COLUMN discount_percentage INT NULL,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0;

CREATE TABLE password_reset_tokens (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id);

CREATE TABLE system_settings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    version BIGINT NULL,
    store_name VARCHAR(120) NOT NULL,
    tagline VARCHAR(160) NOT NULL,
    store_email VARCHAR(160) NOT NULL,
    store_phone VARCHAR(40) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    timezone VARCHAR(64) NOT NULL,
    logo_url VARCHAR(1024) NOT NULL,
    address_line1 VARCHAR(160) NOT NULL,
    address_line2 VARCHAR(160) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    business_registration_number VARCHAR(80) NOT NULL,
    cash_on_delivery_enabled BOOLEAN NOT NULL,
    bank_transfer_enabled BOOLEAN NOT NULL,
    bank_name VARCHAR(120) NOT NULL,
    bank_account_name VARCHAR(120) NOT NULL,
    bank_account_number VARCHAR(80) NOT NULL,
    flat_shipping_rate DECIMAL(14, 2) NOT NULL,
    free_shipping_threshold DECIMAL(14, 2) NOT NULL,
    estimated_delivery_days INT NOT NULL,
    store_pickup_enabled BOOLEAN NOT NULL,
    meta_title VARCHAR(70) NOT NULL,
    meta_description VARCHAR(170) NOT NULL,
    search_indexing_enabled BOOLEAN NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    sender_email VARCHAR(160) NOT NULL,
    order_notification_email VARCHAR(160) NOT NULL,
    order_confirmation_enabled BOOLEAN NOT NULL,
    facebook_url VARCHAR(300) NOT NULL,
    instagram_url VARCHAR(300) NOT NULL,
    tiktok_url VARCHAR(300) NOT NULL,
    whatsapp_number VARCHAR(30) NOT NULL,
    maintenance_mode BOOLEAN NOT NULL,
    maintenance_message VARCHAR(300) NOT NULL,
    updated_by VARCHAR(160) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
);
