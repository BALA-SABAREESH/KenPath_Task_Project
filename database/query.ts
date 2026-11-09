import { initDatabase, query, isNeonConfigured } from '../backend/src/database/db.js';

async function showData() {
  console.log('--- Sweety Database Query Tool ---');

  await initDatabase();

  if (!isNeonConfigured()) {
    console.log('⚠ DATABASE_URL not configured. Showing in-memory data only.');
  }

  // 1. Show all users
  console.log('\n👤 USERS TABLE');
  console.log('═'.repeat(80));
  const users = await query('SELECT id, name, email, created_at FROM users ORDER BY created_at');
  if (users.rows.length === 0) {
    console.log('  (no users)');
  } else {
    for (const u of users.rows) {
      console.log(`  ID:         ${u.id}`);
      console.log(`  Name:       ${u.name}`);
      console.log(`  Email:      ${u.email}`);
      console.log(`  Created:    ${u.created_at}`);
      console.log(`  ${'─'.repeat(76)}`);
    }
  }

  // 2. Count readings
  console.log('\n📊 READINGS SUMMARY');
  console.log('═'.repeat(80));
  const countRes = await query('SELECT COUNT(*)::int AS total FROM readings');
  console.log(`  Total readings: ${countRes.rows[0].total}`);

  // 3. Readings per user
  console.log('\n📈 READINGS PER USER');
  console.log('═'.repeat(80));
  const perUser = await query(`
    SELECT u.name, u.email, COUNT(r.id)::int AS reading_count,
           MIN(r.glucose_value)::int AS lowest,
           MAX(r.glucose_value)::int AS highest,
           ROUND(AVG(r.glucose_value), 1) AS average
    FROM users u
    LEFT JOIN readings r ON r.user_id = u.id
    GROUP BY u.id, u.name, u.email
    ORDER BY u.name
  `);
  if (perUser.rows.length === 0) {
    console.log('  (no data)');
  } else {
    console.log(`  ${'Name'.padEnd(15)} ${'Email'.padEnd(25)} ${'Count'.padStart(7)} ${'Low'.padStart(6)} ${'High'.padStart(6)} ${'Avg'.padStart(7)}`);
    console.log(`  ${'─'.repeat(76)}`);
    for (const r of perUser.rows) {
      console.log(`  ${String(r.name).padEnd(15)} ${String(r.email).padEnd(25)} ${String(r.reading_count).padStart(7)} ${String(r.lowest || '-').padStart(6)} ${String(r.highest || '-').padStart(6)} ${String(r.average || '-').padStart(7)}`);
    }
  }

  // 4. Recent readings (last 10)
  console.log('\n🕐 RECENT READINGS (last 10)');
  console.log('═'.repeat(80));
  const recent = await query(`
    SELECT r.reading_date, r.time_slot, r.glucose_value, u.email
    FROM readings r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.reading_date DESC, r.created_at DESC
    LIMIT 10
  `);
  if (recent.rows.length === 0) {
    console.log('  (no readings)');
  } else {
    console.log(`  ${'Date'.padEnd(14)} ${'Time Slot'.padEnd(22)} ${'Value'.padStart(8)}   ${'User'}`);
    console.log(`  ${'─'.repeat(76)}`);
    for (const r of recent.rows) {
      const dateStr = typeof r.reading_date === 'string' ? r.reading_date.substring(0, 10) : new Date(r.reading_date).toISOString().substring(0, 10);
      console.log(`  ${dateStr.padEnd(14)} ${String(r.time_slot).padEnd(22)} ${String(r.glucose_value).padStart(8)}   ${r.email}`);
    }
  }

  // 5. Slot distribution
  console.log('\n📋 READINGS BY TIME SLOT');
  console.log('═'.repeat(80));
  const slots = await query(`
    SELECT time_slot, COUNT(*)::int AS count,
           ROUND(AVG(glucose_value), 1) AS avg_value
    FROM readings
    GROUP BY time_slot
    ORDER BY
      CASE time_slot
        WHEN 'Morning (fasting)' THEN 1
        WHEN 'After breakfast' THEN 2
        WHEN 'After lunch' THEN 3
        WHEN 'After dinner' THEN 4
      END
  `);
  if (slots.rows.length === 0) {
    console.log('  (no readings)');
  } else {
    console.log(`  ${'Time Slot'.padEnd(22)} ${'Count'.padStart(7)} ${'Avg mg/dl'.padStart(12)}`);
    console.log(`  ${'─'.repeat(76)}`);
    for (const s of slots.rows) {
      console.log(`  ${String(s.time_slot).padEnd(22)} ${String(s.count).padStart(7)} ${String(s.avg_value).padStart(12)}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✓ Query complete.');
  process.exit(0);
}

showData().catch((err) => {
  console.error('Query failed:', err.message);
  process.exit(1);
});
