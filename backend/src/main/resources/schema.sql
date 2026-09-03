-- Drop existing tables
DROP TABLE IF EXISTS show_tickets CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS museums CASCADE;

-- Museums Table
CREATE TABLE museums (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    museum_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    adult_price DECIMAL(10,2) DEFAULT 0,
    child_price DECIMAL(10,2) DEFAULT 0,
    seat_limit INTEGER DEFAULT 100,
    verification_code VARCHAR(50),
    booking_status BOOLEAN DEFAULT true,
    qr_code_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(20),
    otp VARCHAR(10),
    otp_expiry TIMESTAMP,
    otp_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Table
CREATE TABLE tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    museum_id BIGINT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
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
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    museum_id BIGINT NOT NULL,
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
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    show_id BIGINT NOT NULL,
    museum_id BIGINT NOT NULL,
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