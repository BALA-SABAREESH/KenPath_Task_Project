-- ============================================================================
-- Sweety – Blood Glucose Tracker
-- Database Schema for Neon PostgreSQL
-- ============================================================================

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-initializing
-- (Foreign key dependencies cascade automatically)
DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- Table: users
-- Stores registered patient accounts
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for rapid email lookups during login
CREATE INDEX idx_users_email ON users(LOWER(email));

-- ----------------------------------------------------------------------------
-- Table: readings
-- Stores blood glucose measurements across the four mandated daily slots
-- ----------------------------------------------------------------------------
CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    glucose_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Rule: Glucose value must be an integer between 40 and 600 mg/dl
    CONSTRAINT chk_glucose_value_range 
        CHECK (glucose_value >= 40 AND glucose_value <= 600),

    -- Rule: Time slot must be one of the four allowed clinical slots
    CONSTRAINT chk_time_slot_allowed 
        CHECK (time_slot IN (
            'Morning (fasting)',
            'After breakfast',
            'After lunch',
            'After dinner'
        )),

    -- Rule: Enforce exactly one reading per slot per user per day
    CONSTRAINT uq_user_date_slot 
        UNIQUE (user_id, reading_date, time_slot)
);

-- Performance Indexes
CREATE INDEX idx_readings_user_date ON readings(user_id, reading_date DESC);
CREATE INDEX idx_readings_user_date_range ON readings(user_id, reading_date);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
