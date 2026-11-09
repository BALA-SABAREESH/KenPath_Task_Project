# Sweety Database Architecture (Neon PostgreSQL)

This directory contains the database definition, migrations, and seed scripts for **Sweety – Blood Glucose Tracker**.

## Overview
- **Database Engine**: Neon Serverless PostgreSQL (Postgres 15+)
- **Connection**: SSL mode `require` via `pg` (node-postgres connection pool)
- **Primary Keys**: UUIDs generated via PostgreSQL `gen_random_uuid()`
- **Integrity**: Cascading foreign keys, strict check constraints, unique composite constraints

## Schema Diagram

```
+-------------------------------------------------------+
|                        users                          |
+-------------------------------------------------------+
| id            | UUID          | PRIMARY KEY           |
| name          | VARCHAR(255)  | NOT NULL              |
| email         | VARCHAR(255)  | UNIQUE, NOT NULL      |
| password_hash | VARCHAR(255)  | NOT NULL (bcrypt)     |
| created_at    | TIMESTAMPTZ   | DEFAULT CURRENT_TIME  |
| updated_at    | TIMESTAMPTZ   | DEFAULT CURRENT_TIME  |
+-------------------------------------------------------+
                           | 1
                           |
                           | N
+-------------------------------------------------------+
|                       readings                        |
+-------------------------------------------------------+
| id            | UUID          | PRIMARY KEY           |
| user_id       | UUID          | FK -> users(id) ON DEL|
| reading_date  | DATE          | NOT NULL              |
| time_slot     | VARCHAR(50)   | NOT NULL (CHECK)      |
| glucose_value | INTEGER       | NOT NULL (40-600 mg)  |
| created_at    | TIMESTAMPTZ   | DEFAULT CURRENT_TIME  |
| updated_at    | TIMESTAMPTZ   | DEFAULT CURRENT_TIME  |
+-------------------------------------------------------+
CONSTRAINT: UNIQUE (user_id, reading_date, time_slot)
CONSTRAINT: CHECK (glucose_value >= 40 AND glucose_value <= 600)
CONSTRAINT: CHECK (time_slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'))
```

## Mandatory Clinical Rules Enforced at Database Level
1. **Value Range**: `chk_glucose_value_range` ensures all measurements are between 40 and 600 mg/dl.
2. **Valid Slots**: `chk_time_slot_allowed` restricts values to the 4 permitted timeslots.
3. **One Reading Per Slot Per Day**: `uq_user_date_slot` composite unique index prevents accidental or concurrent duplicate readings.
4. **Cascade Deletion**: When a user account is removed, all patient readings are cleaned up automatically.

## How to Initialize & Seed
1. Ensure your Neon `DATABASE_URL` is set in `backend/.env`.
2. Run schema initialization:
   ```bash
   npm run db:init
   ```
3. Run the repeatable seed script:
   ```bash
   npm run db:seed
   ```
