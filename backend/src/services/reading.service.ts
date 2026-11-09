import { query, getClient } from '../database/db.js';
import { ReadingInput, isDateInFuture } from '../validators/reading.validator.js';

export interface ReadingRecord {
  id: string;
  user_id: string;
  reading_date: string;
  time_slot: string;
  glucose_value: number;
  created_at: string | Date;
  updated_at: string | Date;
}

export class ReadingService {
  static async create(userId: string, input: ReadingInput): Promise<ReadingRecord> {
    const { reading_date, time_slot, glucose_value } = input;

    // Rule: Date cannot be in the future
    if (isDateInFuture(reading_date)) {
      const error: any = new Error('Date cannot be in the future.');
      error.statusCode = 400;
      throw error;
    }

    // Rule: Value must be between 40 and 600
    if (glucose_value < 40 || glucose_value > 600 || !Number.isInteger(glucose_value)) {
      const error: any = new Error('Value must be between 40 and 600 mg/dl.');
      error.statusCode = 400;
      throw error;
    }

    const client = await getClient();
    try {
      // 1. Check slot duplicate
      const slotCheck = await client.query(
        `SELECT id FROM readings 
         WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3`,
        [userId, reading_date, time_slot]
      );

      if (slotCheck.rows.length > 0) {
        const error: any = new Error(`You already have an ${time_slot} reading for this date.`);
        error.statusCode = 400;
        throw error;
      }

      // 2. Check 4 readings per day limit
      const countCheck = await client.query(
        `SELECT COUNT(*) AS count FROM readings 
         WHERE user_id = $1 AND reading_date = $2`,
        [userId, reading_date]
      );

      const currentCount = parseInt(countCheck.rows[0].count, 10);
      if (currentCount >= 4) {
        const error: any = new Error('You can add only 4 readings per day.');
        error.statusCode = 400;
        throw error;
      }

      // 3. Insert reading
      const insertResult = await client.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at`,
        [userId, reading_date, time_slot, glucose_value]
      );

      return insertResult.rows[0];
    } finally {
      if ('release' in client && typeof client.release === 'function') {
        client.release();
      }
    }
  }

  static async update(userId: string, id: string, input: ReadingInput): Promise<ReadingRecord> {
    const { reading_date, time_slot, glucose_value } = input;

    // Rule: Date cannot be in the future
    if (isDateInFuture(reading_date)) {
      const error: any = new Error('Date cannot be in the future.');
      error.statusCode = 400;
      throw error;
    }

    // Rule: Value must be between 40 and 600
    if (glucose_value < 40 || glucose_value > 600 || !Number.isInteger(glucose_value)) {
      const error: any = new Error('Value must be between 40 and 600 mg/dl.');
      error.statusCode = 400;
      throw error;
    }

    // Verify existing record ownership
    const existing = await query(
      `SELECT id, reading_date, time_slot FROM readings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      const error: any = new Error('Reading not found.');
      error.statusCode = 404;
      throw error;
    }

    // Check duplicate slot conflict with other readings
    const slotConflict = await query(
      `SELECT id FROM readings 
       WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4`,
      [userId, reading_date, time_slot, id]
    );

    if (slotConflict.rows.length > 0) {
      const error: any = new Error(`You already have an ${time_slot} reading for this date.`);
      error.statusCode = 400;
      throw error;
    }

    // Check 4-per-day limit if date was changed
    if (existing.rows[0].reading_date !== reading_date) {
      const countCheck = await query(
        `SELECT COUNT(*) AS count FROM readings 
         WHERE user_id = $1 AND reading_date = $2 AND id != $3`,
        [userId, reading_date, id]
      );
      if (parseInt(countCheck.rows[0].count, 10) >= 4) {
        const error: any = new Error('You can add only 4 readings per day.');
        error.statusCode = 400;
        throw error;
      }
    }

    const updateResult = await query(
      `UPDATE readings 
       SET reading_date = $1, time_slot = $2, glucose_value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at`,
      [reading_date, time_slot, glucose_value, id, userId]
    );

    return updateResult.rows[0];
  }

  static async delete(userId: string, id: string): Promise<void> {
    const result = await query(
      `DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      const error: any = new Error('Reading not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  static async getById(userId: string, id: string): Promise<ReadingRecord> {
    const result = await query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Reading not found.');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  static async getAll(
    userId: string,
    filters?: { date?: string; startDate?: string; endDate?: string }
  ): Promise<ReadingRecord[]> {
    let sql = `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
               FROM readings WHERE user_id = $1`;
    const params: any[] = [userId];

    if (filters?.date) {
      params.push(filters.date);
      sql += ` AND reading_date = $${params.length}`;
    } else if (filters?.startDate && filters?.endDate) {
      params.push(filters.startDate);
      params.push(filters.endDate);
      sql += ` AND reading_date >= $${params.length - 1} AND reading_date <= $${params.length}`;
    }

    sql += ` ORDER BY reading_date DESC, created_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }
}
