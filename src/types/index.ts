export type TimeSlot =
  | 'Morning (fasting)'
  | 'After breakfast'
  | 'After lunch'
  | 'After dinner';

export const TIME_SLOTS: TimeSlot[] = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface Reading {
  id: string;
  user_id: string;
  reading_date: string; // YYYY-MM-DD
  time_slot: TimeSlot;
  glucose_value: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingPayload {
  reading_date: string;
  time_slot: TimeSlot;
  glucose_value: number;
}

export interface ReportStats {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  totalReadings: number;
}

export interface ReportData {
  type: 'daily' | 'month-to-date' | 'monthly';
  targetDate: string;
  startDate: string;
  endDate: string;
  statistics: ReportStats;
  readings: Reading[];
}

export interface DBStatus {
  provider: string;
  connected: boolean;
  databaseUrlConfigured: boolean;
  host: string;
  database: string;
  message: string;
}
