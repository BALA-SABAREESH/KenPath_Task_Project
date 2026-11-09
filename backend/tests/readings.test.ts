import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase } from '../src/database/db.js';

const app = createApp();

describe('Readings Management & Mandatory Clinical Validation (/api/readings)', () => {
  let userTokenA: string;
  let userTokenB: string;
  let userIdA: string;
  let userIdB: string;

  const validDate = '2026-10-15'; // Past valid date

  beforeAll(async () => {
    await initDatabase();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient A',
        email: `patient_a_${Date.now()}@sweety.test`,
        password: 'Password123!',
      });
    userTokenA = resA.body.token;
    userIdA = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient B',
        email: `patient_b_${Date.now()}@sweety.test`,
        password: 'Password123!',
      });
    userTokenB = resB.body.token;
    userIdB = resB.body.user.id;
  });

  describe('Mandatory Validation Rules', () => {
    it('Rule 1: Should reject when glucose value is missing ("Please enter a glucose value.")', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: validDate,
          time_slot: 'Morning (fasting)',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter a glucose value.');
    });

    it('Rule 2A: Should reject value below 40 mg/dl ("Value must be between 40 and 600 mg/dl.")', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: validDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 39,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule 2B: Should reject value above 600 mg/dl ("Value must be between 40 and 600 mg/dl.")', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: validDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule 2C: Should reject decimal values (whole number only)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: validDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 105.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule 5: Should reject dates in the future ("Date cannot be in the future.")', async () => {
      const futureDate = '2099-12-31';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: futureDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 110,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Date cannot be in the future.');
    });
  });

  describe('Slot Uniqueness & Four Readings Limit', () => {
    const testDate = '2026-09-20';
    let morningReadingId: string;

    it('should successfully add Morning (fasting) reading', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 95,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.reading.glucose_value).toBe(95);
      morningReadingId = res.body.reading.id;
    });

    it('Rule 3: Should reject duplicate reading for the same slot on the same date', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 102,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('You already have an Morning (fasting) reading for this date.');
    });

    it('should add After breakfast, After lunch, and After dinner successfully', async () => {
      const slots = [
        { slot: 'After breakfast', val: 140 },
        { slot: 'After lunch', val: 130 },
        { slot: 'After dinner', val: 155 },
      ];

      for (const item of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userTokenA}`)
          .send({
            reading_date: testDate,
            time_slot: item.slot,
            glucose_value: item.val,
          });
        expect(res.status).toBe(201);
      }
    });

    it('Rule 4: Should reject 5th reading on the same day ("You can add only 4 readings per day.")', async () => {
      // Even if another slot name was attempted or force sent
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 120,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow editing an existing reading without counting itself as duplicate', async () => {
      const res = await request(app)
        .put(`/api/readings/${morningReadingId}`)
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: testDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 98,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reading.glucose_value).toBe(98);
    });
  });

  describe('User Ownership & Security Isolation', () => {
    let readingAId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          reading_date: '2026-08-10',
          time_slot: 'After lunch',
          glucose_value: 132,
        });
      readingAId = res.body.reading.id;
    });

    it('User B should NOT be able to view User A reading by ID', async () => {
      const res = await request(app)
        .get(`/api/readings/${readingAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('User B should NOT be able to update User A reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingAId}`)
        .set('Authorization', `Bearer ${userTokenB}`)
        .send({
          reading_date: '2026-08-10',
          time_slot: 'After lunch',
          glucose_value: 200,
        });

      expect(res.status).toBe(404);
    });

    it('User B should NOT be able to delete User A reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingAId}`)
        .set('Authorization', `Bearer ${userTokenB}`);

      expect(res.status).toBe(404);
    });

    it('User A should be able to delete their own reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingAId}`)
        .set('Authorization', `Bearer ${userTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
