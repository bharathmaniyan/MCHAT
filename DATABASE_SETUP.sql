-- ============================================================================
-- PostgreSQL Database Setup Script for Museum Ticket Booking System
-- ============================================================================
-- Run this script using: psql -U postgres -f DATABASE_SETUP.sql

-- Create the museum_db database
CREATE DATABASE museum_db 
    WITH OWNER postgres
    ENCODING 'UTF8'
    LOCALE_PROVIDER 'libc'
    LOCALE 'en_US.UTF-8';

-- Grant privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE museum_db TO postgres;

-- Connect to the database and create extensions
\c museum_db;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set search path
SET search_path = public;

-- ============================================================================
-- Tables will be auto-created by Hibernate on first run
-- ============================================================================
