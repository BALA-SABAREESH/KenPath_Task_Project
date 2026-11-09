import { query } from '../database/db.js';
import { ReadingRecord } from './reading.service.js';

export interface ReportStatistics {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  totalReadings: number;
}

export interface ReportResponse {
  type: 'daily' | 'month-to-date' | 'monthly';
  startDate: string;
  endDate: string;
  targetDate: string;
  statistics: ReportStatistics;
  readings: ReadingRecord[];
}

export class ReportService {
  /**
   * Calculate summary statistics from an array of readings
   */
  private static calculateStatistics(readings: ReadingRecord[]): ReportStatistics {
    if (!readings || readings.length === 0) {
      return {
        highest: null,
        lowest: null,
        average: null,
        totalReadings: 0,
      };
    }

    const values = readings.map((r) => r.glucose_value);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const average = Math.round((sum / values.length) * 10) / 10; // Round to one decimal place

    return {
      highest,
      lowest,
      average,
      totalReadings: readings.length,
    };
  }

  /**
   * Helper to format Date object into YYYY-MM-DD using UTC/local parts cleanly
   */
  private static formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * DAILY REPORT: Selected date only
   */
  static async getDailyReport(userId: string, targetDateStr?: string): Promise<ReportResponse> {
    const date = targetDateStr || this.formatDate(new Date());

    const result = await query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY 
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, date]
    );

    const readings: ReadingRecord[] = result.rows;
    const statistics = this.calculateStatistics(readings);

    return {
      type: 'daily',
      targetDate: date,
      startDate: date,
      endDate: date,
      statistics,
      readings,
    };
  }

  /**
   * MONTH-TO-DATE REPORT: First day of selected month through selected date
   */
  static async getMonthToDateReport(userId: string, targetDateStr?: string): Promise<ReportResponse> {
    const targetDate = targetDateStr ? new Date(targetDateStr + 'T00:00:00') : new Date();
    
    // First day of current month
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDay = new Date(year, month, 1);

    const startDate = this.formatDate(firstDay);
    const endDate = targetDateStr || this.formatDate(targetDate);

    const result = await query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC,
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, startDate, endDate]
    );

    const readings: ReadingRecord[] = result.rows;
    const statistics = this.calculateStatistics(readings);

    return {
      type: 'month-to-date',
      targetDate: endDate,
      startDate,
      endDate,
      statistics,
      readings,
    };
  }

  /**
   * MONTHLY REPORT: Entire previous calendar month
   * e.g., if selected date is in November 2026, report covers 2026-10-01 to 2026-10-31
   */
  static async getMonthlyReport(userId: string, targetDateStr?: string): Promise<ReportResponse> {
    const referenceDate = targetDateStr ? new Date(targetDateStr + 'T00:00:00') : new Date();

    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth(); // 0-indexed

    // Calculate previous month start and end
    // Date(year, month, 1) where month is currentMonth - 1
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    // Date(year, month, 0) gives last day of prevMonth
    const prevMonthEnd = new Date(currentYear, currentMonth, 0);

    const startDate = this.formatDate(prevMonthStart);
    const endDate = this.formatDate(prevMonthEnd);
    const refDateFormatted = targetDateStr || this.formatDate(referenceDate);

    const result = await query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC,
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, startDate, endDate]
    );

    const readings: ReadingRecord[] = result.rows;
    const statistics = this.calculateStatistics(readings);

    return {
      type: 'monthly',
      targetDate: refDateFormatted,
      startDate,
      endDate,
      statistics,
      readings,
    };
  }
}
