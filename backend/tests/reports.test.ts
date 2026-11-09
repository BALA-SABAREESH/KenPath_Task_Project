import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase } from '../src/database/db.js';

const app = createApp();

describe('Clinical Reports Module (/api/reports)', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    await initDatabase();

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Report Test User',
        email: `report_user_${Date.now()}@sweety.test`,
        password: 'Password123!',
      });
    userToken = res.body.token;
    userId = res.body.user.id;

    // Seed specific dataset for test date: 2026-05-15
    // Readings: 90 (Morning), 140 (Breakfast), 125 (Lunch), 165 (Dinner)
    // Highest: 165, Lowest: 90, Sum: 520, Count: 4, Average: 520/4 = 130.0
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_date: '2026-05-15', time_slot: 'Morning (fasting)', glucose_value: 90 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_date: '2026-05-15', time_slot: 'After breakfast', glucose_value: 140 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_date: '2026-05-15', time_slot: 'After lunch', glucose_value: 125 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_date: '2026-05-15', time_slot: 'After dinner', glucose_value: 165 });

    // Also add another day in same month (2026-05-02)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_date: '2026-05-02', time_slot: 'Morning (fasting)', glucose_value: 100 });

    // And add previous month reading (2026-04-20)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_date: '2026-04-20', time_slot: 'Morning (fasting)', glucose_value: 110 });
  });

  describe('GET /api/reports/daily', () => {
    it('should compute accurate statistics and list individual readings for selected date', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-05-15')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const report = res.body.report;

      expect(report.type).toBe('daily');
      expect(report.targetDate).toBe('2026-05-15');
      expect(report.statistics.highest).toBe(165);
      expect(report.statistics.lowest).toBe(90);
      expect(report.statistics.average).toBe(130.0);
      expect(report.statistics.totalReadings).toBe(4);

      // Verify individual readings are included and ordered
      expect(report.readings.length).toBe(4);
      expect(report.readings[0].time_slot).toBe('Morning (fasting)');
      expect(report.readings[3].time_slot).toBe('After dinner');
    });

    it('should handle empty reports with null statistics and empty readings array', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-01-01')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const report = res.body.report;

      expect(report.statistics.totalReadings).toBe(0);
      expect(report.statistics.highest).toBeNull();
      expect(report.statistics.lowest).toBeNull();
      expect(report.statistics.average).toBeNull();
      expect(report.readings).toEqual([]);
    });
  });

  describe('GET /api/reports/month-to-date', () => {
    it('should compute metrics from first day of month through selected date', async () => {
      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-05-15')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const report = res.body.report;

      expect(report.type).toBe('month-to-date');
      expect(report.startDate).toBe('2026-05-01');
      expect(report.endDate).toBe('2026-05-15');
      // Total readings in May: 4 on May 15 + 1 on May 02 = 5
      expect(report.statistics.totalReadings).toBe(5);
      expect(report.statistics.highest).toBe(165);
      expect(report.statistics.lowest).toBe(90);
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('should calculate statistics for entire previous calendar month', async () => {
      // Selected date in May 2026 -> Previous month is April 2026 (2026-04-01 to 2026-04-30)
      const res = await request(app)
        .get('/api/reports/monthly?date=2026-05-15')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const report = res.body.report;

      expect(report.type).toBe('monthly');
      expect(report.startDate).toBe('2026-04-01');
      expect(report.endDate).toBe('2026-04-30');
      expect(report.statistics.totalReadings).toBe(1);
      expect(report.statistics.highest).toBe(110);
      expect(report.statistics.lowest).toBe(110);
      expect(report.statistics.average).toBe(110.0);
    });
  });
});
