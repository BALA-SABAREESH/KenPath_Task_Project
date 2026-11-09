import bcrypt from 'bcryptjs';
import { query, initDatabase } from '../backend/src/database/db.js';

async function seed() {
  console.log('--- Sweety Database Seeder ---');
  await initDatabase();

  const demoEmail = 'demo@sweety.app';
  const demoPassword = 'Demo@12345';
  const demoName = 'Demo User';

  // 1. Check or insert Demo User
  let userResult = await query(
    'SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)',
    [demoEmail]
  );

  let userId: string;

  if (userResult.rows.length === 0) {
    console.log(`Creating demo user: ${demoEmail}...`);
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [demoName, demoEmail, passwordHash]
    );
    userId = insertRes.rows[0].id;
    console.log(`✓ Demo user created with ID: ${userId}`);
  } else {
    userId = userResult.rows[0].id;
    console.log(`✓ Demo user already exists with ID: ${userId}`);
  }

  // 2. Generate sample readings across past 21 days + previous month
  console.log('Generating clinical glucose readings across four daily slots...');

  const slots = [
    { slot: 'Morning (fasting)', base: 98, variance: 18 },
    { slot: 'After breakfast', base: 145, variance: 25 },
    { slot: 'After lunch', base: 135, variance: 22 },
    { slot: 'After dinner', base: 152, variance: 28 },
  ];

  const now = new Date();
  let insertedCount = 0;

  // Insert readings for past 20 days (including today)
  for (let d = 0; d < 20; d++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - d);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Today gets 3 readings (Morning, Breakfast, Lunch) so user can add Dinner
    // Previous days get all 4 or 3 readings
    const dailySlots = d === 0 ? slots.slice(0, 3) : slots;

    for (const item of dailySlots) {
      // Deterministic realistic variance
      const jitter = ((d * 11 + item.base * 7) % item.variance) - Math.floor(item.variance / 2);
      const glucoseValue = Math.max(72, Math.min(240, item.base + jitter));

      // Safe idempotent upsert / insert if not exists
      const existing = await query(
        `SELECT id FROM readings 
         WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3`,
        [userId, dateStr, item.slot]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
           VALUES ($1, $2, $3, $4)`,
          [userId, dateStr, item.slot, glucoseValue]
        );
        insertedCount++;
      }
    }
  }

  // Also ensure previous calendar month has data for the Monthly Report
  const prevMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  for (let day = 5; day <= 25; day += 3) {
    const pDate = new Date(prevMonthRef.getFullYear(), prevMonthRef.getMonth(), day);
    const dateStr = pDate.toISOString().split('T')[0];

    for (const item of slots) {
      const jitter = ((day * 9 + item.base) % item.variance) - 8;
      const glucoseValue = Math.max(75, Math.min(235, item.base + jitter));

      const existing = await query(
        `SELECT id FROM readings 
         WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3`,
        [userId, dateStr, item.slot]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
           VALUES ($1, $2, $3, $4)`,
          [userId, dateStr, item.slot, glucoseValue]
        );
        insertedCount++;
      }
    }
  }

  console.log(`✓ Seed completed successfully! Inserted ${insertedCount} new readings.`);
  console.log(`Demo Credentials:`);
  console.log(`  Email:    ${demoEmail}`);
  console.log(`  Password: ${demoPassword}`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
