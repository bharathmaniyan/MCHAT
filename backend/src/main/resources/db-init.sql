-- ============================================================
-- MUSEUM TICKET BOOKING - DATABASE INITIALIZATION
-- PostgreSQL Database Script
-- ============================================================

-- Drop existing tables (if needed for fresh setup)
DROP TABLE IF EXISTS show_tickets CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS museums CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- MUSEUMS TABLE
-- ============================================================
CREATE TABLE museums (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ticket_price DECIMAL(10,2) NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    booking_open BOOLEAN DEFAULT TRUE,
    museum_code VARCHAR(4) NOT NULL UNIQUE,
    museum_id VARCHAR(10) UNIQUE,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    
    -- Museum Admin fields
    museum_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    location TEXT,
    adult_price DECIMAL(10,2),
    child_price DECIMAL(10,2),
    seat_limit INTEGER,
    staff_pin VARCHAR(4),
    verification_code VARCHAR(50),
    booking_status BOOLEAN DEFAULT TRUE,
    qr_code_url TEXT
);

CREATE INDEX idx_museums_email ON museums(email);
CREATE INDEX idx_museums_booking_open ON museums(booking_open);
CREATE INDEX idx_museums_museum_code ON museums(museum_code);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(20),
    otp VARCHAR(10),
    otp_expiry TIMESTAMP,
    otp_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    ticket_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- ============================================================
-- TICKETS TABLE
-- ============================================================
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    booking_id BIGINT NOT NULL,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    used_at BIGINT,
    
    -- Additional fields for museum admin integration
    museum_id BIGINT,
    user_email VARCHAR(255),
    phone VARCHAR(20),
    adults INTEGER DEFAULT 0,
    children INTEGER DEFAULT 0,
    total_price DECIMAL(10,2),
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    secret_code VARCHAR(10),
    email_sent BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_user_email ON tickets(user_email);
CREATE INDEX idx_tickets_museum_id ON tickets(museum_id);

-- ============================================================
-- SHOWS TABLE
-- ============================================================
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    capacity INTEGER DEFAULT 0,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    
    -- Additional museum integration fields
    museum_id BIGINT,
    show_name VARCHAR(255),
    show_time TIMESTAMP,
    price DECIMAL(10,2),
    seat_limit INTEGER,
    available_seats INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shows_available ON shows(available);
CREATE INDEX idx_shows_date ON shows(date);
CREATE INDEX idx_shows_museum_id ON shows(museum_id);

-- ============================================================
-- SHOW_TICKETS TABLE
-- ============================================================
CREATE TABLE show_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    show_id INTEGER NOT NULL,
    museum_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10,2) DEFAULT 0,
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    
    CONSTRAINT fk_show_tickets_show FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);

CREATE INDEX idx_show_tickets_show_id ON show_tickets(show_id);
CREATE INDEX idx_show_tickets_user_email ON show_tickets(user_email);
CREATE INDEX idx_show_tickets_status ON show_tickets(status);

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert sample museum
INSERT INTO museums (
    name, 
    ticket_price, 
    total_seats, 
    available_seats, 
    booking_open, 
    museum_code,
    museum_id,
    museum_name,
    location,
    adult_price,
    child_price,
    seat_limit,
    staff_pin,
    booking_status
) VALUES (
    'City Museum', 
    100, 
    100, 
    100, 
    true, 
    '1234',
    'MUS001',
    'City Museum',
    'Downtown',
    100.00,
    50.00,
    100,
    '1234',
    true
);

-- Insert sample shows
INSERT INTO shows (name, date, available, capacity, show_name, show_time, seat_limit, available_seats, description, status)
VALUES 
    ('Ancient Egypt Exhibition', NOW() + INTERVAL '1 day', true, 50, 'Ancient Egypt Exhibition', NOW() + INTERVAL '1 day', 50, 50, 'Explore ancient Egyptian artifacts', 'ACTIVE'),
    ('Modern Art Collection', NOW() + INTERVAL '2 days', true, 75, 'Modern Art Collection', NOW() + INTERVAL '2 days', 75, 75, 'Contemporary art from local artists', 'ACTIVE'),
    ('Science & Technology', NOW() + INTERVAL '3 days', true, 100, 'Science & Technology', NOW() + INTERVAL '3 days', 100, 100, 'Interactive science exhibits', 'ACTIVE');

-- ============================================================
-- VERIFY INSERTION
-- ============================================================
SELECT 'Museum records:' as info;
SELECT * FROM museums LIMIT 1;

SELECT 'Shows records:' as info;
SELECT COUNT(*) as show_count FROM shows;

COMMIT;
