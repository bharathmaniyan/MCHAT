-- ============================================================
-- MUSEUM TICKET BOOKING - COMPLETE DATABASE SCHEMA
-- Run this on a fresh PostgreSQL database.
-- If migrating from existing DB run the ALTER section below.
-- ============================================================

-- ========================
-- DROP (for fresh setup)
-- ========================
DROP TABLE IF EXISTS show_tickets CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS museums CASCADE;

-- ========================
-- MUSEUMS
-- ========================
CREATE TABLE museums (
    id                SERIAL PRIMARY KEY,
    museum_name       VARCHAR(255)    NOT NULL,
    email             VARCHAR(255)    UNIQUE NOT NULL,
    password          VARCHAR(255)    NOT NULL,
    location          TEXT            NOT NULL,
    adult_price       DECIMAL(10,2)   DEFAULT 0,
    child_price       DECIMAL(10,2)   DEFAULT 0,
    seat_limit        INTEGER         DEFAULT 100,
    -- 4-digit staff validation PIN known only to museum staff
    staff_pin         VARCHAR(4)      NOT NULL DEFAULT LPAD(FLOOR(RANDOM()*9000+1000)::TEXT, 4, '0'),
    -- legacy verification_code kept for backwards compat (unused in new flow)
    verification_code VARCHAR(50),
    booking_status    BOOLEAN         DEFAULT TRUE,
    qr_code_url       TEXT,
    created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password      VARCHAR(255),
    name          VARCHAR(255),
    phone         VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- OTP TABLE (separate, TTL-controlled)
-- ========================
CREATE TABLE otps (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    otp        VARCHAR(10)  NOT NULL,
    otp_expiry TIMESTAMP    NOT NULL,
    verified   BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- TICKETS
-- ========================
CREATE TABLE tickets (
    id            SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50)     UNIQUE NOT NULL,
    museum_id     INTEGER         NOT NULL,
    user_email    VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20),
    adults        INTEGER         DEFAULT 0 CHECK (adults >= 0),
    children      INTEGER         DEFAULT 0 CHECK (children >= 0),
    total_price   DECIMAL(10,2)   DEFAULT 0,
    payment_id    VARCHAR(255),
    order_id      VARCHAR(255),
    -- secret_code is the per-ticket unique code sent to user in email
    -- staff verifies by entering museum staff_pin (NOT this secret_code)
    -- secret_code is kept for future user self-check QR purpose
    secret_code   VARCHAR(10),
    status        VARCHAR(50)     DEFAULT 'PENDING',
    email_sent    BOOLEAN         DEFAULT FALSE,
    created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    used_at       TIMESTAMP,

    CONSTRAINT fk_tickets_museum FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE,
    CONSTRAINT chk_ticket_status CHECK (status IN ('PENDING','ACTIVE','USED','CANCELLED'))
);

-- ========================
-- SHOWS
-- ========================
CREATE TABLE shows (
    id              SERIAL PRIMARY KEY,
    museum_id       INTEGER         NOT NULL,
    show_name       VARCHAR(255)    NOT NULL,
    show_time       TIMESTAMP       NOT NULL,
    price           DECIMAL(10,2)   DEFAULT 0,
    seat_limit      INTEGER         DEFAULT 0,
    available_seats INTEGER         DEFAULT 0,
    description     TEXT,
    status          VARCHAR(50)     DEFAULT 'ACTIVE',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shows_museum FOREIGN KEY (museum_id) REFERENCES shows(id) ON DELETE CASCADE,
    CONSTRAINT chk_show_status CHECK (status IN ('ACTIVE','INACTIVE','CANCELLED')),
    CONSTRAINT chk_show_seats CHECK (available_seats >= 0 AND seat_limit >= 0)
);

-- ========================
-- SHOW TICKETS
-- ========================
CREATE TABLE show_tickets (
    id            SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50)     UNIQUE NOT NULL,
    show_id       INTEGER         NOT NULL,
    museum_id     INTEGER         NOT NULL,
    user_email    VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20),
    quantity      INTEGER         DEFAULT 1 CHECK (quantity > 0),
    total_price   DECIMAL(10,2)   DEFAULT 0,
    payment_id    VARCHAR(255),
    order_id      VARCHAR(255),
    secret_code   VARCHAR(10),
    status        VARCHAR(50)     DEFAULT 'PENDING',
    email_sent    BOOLEAN         DEFAULT FALSE,
    created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    used_at       TIMESTAMP,

    CONSTRAINT fk_show_tickets_show    FOREIGN KEY (show_id)   REFERENCES shows(id)   ON DELETE CASCADE,
    CONSTRAINT fk_show_tickets_museum  FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE,
    CONSTRAINT chk_show_ticket_status  CHECK (status IN ('PENDING','ACTIVE','USED','CANCELLED'))
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX idx_museums_email               ON museums(email);
CREATE INDEX idx_museums_booking_status      ON museums(booking_status);

CREATE INDEX idx_users_email                 ON users(email);

CREATE INDEX idx_otps_email                  ON otps(email);
CREATE INDEX idx_otps_email_verified         ON otps(email, verified);

CREATE INDEX idx_tickets_museum_id           ON tickets(museum_id);
CREATE INDEX idx_tickets_user_email          ON tickets(user_email);
CREATE INDEX idx_tickets_phone               ON tickets(phone);
CREATE INDEX idx_tickets_status              ON tickets(status);
CREATE INDEX idx_tickets_order_id            ON tickets(order_id);
CREATE INDEX idx_tickets_ticket_number       ON tickets(ticket_number);
CREATE INDEX idx_tickets_created_at          ON tickets(created_at);

CREATE INDEX idx_shows_museum_id             ON shows(museum_id);
CREATE INDEX idx_shows_status                ON shows(status);
CREATE INDEX idx_shows_show_time             ON shows(show_time);

CREATE INDEX idx_show_tickets_show_id        ON show_tickets(show_id);
CREATE INDEX idx_show_tickets_museum_id      ON show_tickets(museum_id);
CREATE INDEX idx_show_tickets_user_email     ON show_tickets(user_email);
CREATE INDEX idx_show_tickets_phone          ON show_tickets(phone);
CREATE INDEX idx_show_tickets_status         ON show_tickets(status);
CREATE INDEX idx_show_tickets_order_id       ON show_tickets(order_id);

-- ========================
-- UPDATED_AT TRIGGER
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_museums_updated_at
    BEFORE UPDATE ON museums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_shows_updated_at
    BEFORE UPDATE ON shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MIGRATION: If you have an existing DB (don't drop tables)
-- run ONLY the ALTER section below instead of the full script.
-- ============================================================

/*
-- Add staff_pin to museums (the new secure 4-digit staff PIN)
ALTER TABLE museums
    ADD COLUMN IF NOT EXISTS staff_pin VARCHAR(4) NOT NULL DEFAULT LPAD(FLOOR(RANDOM()*9000+1000)::TEXT, 4, '0');

-- Add email_sent flag to tickets
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Add email_sent flag to show_tickets
ALTER TABLE show_tickets
    ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Create OTP table if missing
CREATE TABLE IF NOT EXISTS otps (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    otp        VARCHAR(10)  NOT NULL,
    otp_expiry TIMESTAMP    NOT NULL,
    verified   BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_email_verified ON otps(email, verified);
*/
    adults INTEGER DEFAULT 0 CHECK (adults >= 0),
    children INTEGER DEFAULT 0 CHECK (children >= 0),
    total_price DECIMAL(10,2) DEFAULT 0,
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    secret_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    CONSTRAINT fk_tickets_museum FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE,
    CONSTRAINT chk_ticket_status CHECK (status IN ('PENDING', 'ACTIVE', 'USED', 'CANCELLED'))
);

-- Shows Table
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    museum_id INTEGER NOT NULL,
    show_name VARCHAR(255) NOT NULL,
    show_time TIMESTAMP NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    seat_limit INTEGER DEFAULT 0,
    available_seats INTEGER DEFAULT 0,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_shows_museum FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE,
    CONSTRAINT chk_show_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'CANCELLED')),
    CONSTRAINT chk_show_seats CHECK (available_seats >= 0 AND seat_limit >= 0)
);

-- Show Tickets Table
CREATE TABLE show_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    show_id INTEGER NOT NULL,
    museum_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    total_price DECIMAL(10,2) DEFAULT 0,
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    secret_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    CONSTRAINT fk_show_tickets_show FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    CONSTRAINT fk_show_tickets_museum FOREIGN KEY (museum_id) REFERENCES museums(id) ON DELETE CASCADE,
    CONSTRAINT chk_show_ticket_status CHECK (status IN ('PENDING', 'ACTIVE', 'USED', 'CANCELLED'))
);

-- Create Indexes
CREATE INDEX idx_museums_email ON museums(email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tickets_museum_id ON tickets(museum_id);
CREATE INDEX idx_tickets_user_email ON tickets(user_email);
CREATE INDEX idx_tickets_phone ON tickets(phone);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_shows_museum_id ON shows(museum_id);
CREATE INDEX idx_shows_status ON shows(status);
CREATE INDEX idx_shows_show_time ON shows(show_time);
CREATE INDEX idx_show_tickets_show_id ON show_tickets(show_id);
CREATE INDEX idx_show_tickets_museum_id ON show_tickets(museum_id);
CREATE INDEX idx_show_tickets_user_email ON show_tickets(user_email);
CREATE INDEX idx_show_tickets_phone ON show_tickets(phone);
CREATE INDEX idx_show_tickets_status ON show_tickets(status);
CREATE INDEX idx_show_tickets_order_id ON show_tickets(order_id);

-- Create Update Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers
CREATE TRIGGER trg_museums_updated_at
BEFORE UPDATE ON museums
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_shows_updated_at
BEFORE UPDATE ON shows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
