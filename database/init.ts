import fs from 'fs';
import path from 'path';
import { query, initDatabase, isNeonConfigured } from '../backend/src/database/db.js';
import { config } from '../backend/src/config/index.js';

async function main() {
  console.log('--- Sweety Database Initialization ---');
  if (!isNeonConfigured()) {
    console.log('Note: DATABASE_URL in backend/.env is not pointing to a real Neon instance.');
    console.log('Skipping remote migration. Local memory schema will auto-bootstrap.');
    return;
  }

  await initDatabase();
  const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Applying schema to PostgreSQL database...');
  await query(sql);
  console.log('✓ Tables (users, readings), indexes, and constraints successfully initialized!');
}

main().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
