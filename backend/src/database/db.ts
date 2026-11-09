import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

export interface DBStatus {
  provider: 'Neon PostgreSQL' | 'Resilient In-Memory Storage';
  connected: boolean;
  databaseUrlConfigured: boolean;
  host: string;
  database: string;
  message: string;
}

// In-memory fallback state for zero-friction local testing or when Neon string is pending
interface MemoryUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

interface MemoryReading {
  id: string;
  user_id: string;
  reading_date: string; // YYYY-MM-DD
  time_slot: string;
  glucose_value: number;
  created_at: Date;
  updated_at: Date;
}

let memoryUsers: MemoryUser[] = [];
let memoryReadings: MemoryReading[] = [];

// Seed initial memory demo user so tests and UI function immediately
const seedInitialMemoryStore = () => {
  if (memoryUsers.length === 0) {
    const demoId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const demoPasswordHash = bcrypt.hashSync('Demo@12345', 10);
    
    memoryUsers.push({
      id: demoId,
      name: 'Demo User',
      email: 'demo@sweety.app',
      password_hash: demoPasswordHash,
      created_at: new Date('2026-10-01T08:00:00Z'),
      updated_at: new Date('2026-10-01T08:00:00Z'),
    });

    // Sample readings for past 7 days across slots
    const today = new Date();
    const slots = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];
    const sampleValues: Record<string, number> = {
      'Morning (fasting)': 96,
      'After breakfast': 138,
      'After lunch': 124,
      'After dinner': 142,
    };

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Add 3-4 readings per day
      const dailySlots = i % 2 === 0 ? slots : slots.slice(0, 3);
      dailySlots.forEach((slot, sIdx) => {
        const jitter = ((i * 7 + sIdx * 13) % 25) - 10;
        const val = Math.max(70, Math.min(250, sampleValues[slot] + jitter));
        memoryReadings.push({
          id: `reading-${i}-${sIdx}-${Math.random().toString(36).substring(2, 9)}`,
          user_id: demoId,
          reading_date: dateStr,
          time_slot: slot,
          glucose_value: val,
          created_at: new Date(d.getTime() + sIdx * 3600000),
          updated_at: new Date(d.getTime() + sIdx * 3600000),
        });
      });
    }
  }
};

let pool: Pool | null = null;
let isConnectedToNeon = false;
let currentDbHost = 'unconfigured';
let lastErrorMessage = '';

export const isNeonConfigured = (url: string = config.databaseUrl): boolean => {
  if (!url) return false;
  if (url.includes('YOUR_NEON_POSTGRESQL_CONNECTION_STRING')) return false;
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) return false;
  return true;
};

export const initDatabase = async (customUrl?: string): Promise<boolean> => {
  const targetUrl = customUrl || config.databaseUrl;

  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore close errors
    }
    pool = null;
    isConnectedToNeon = false;
  }

  seedInitialMemoryStore();

  if (!isNeonConfigured(targetUrl)) {
    lastErrorMessage = 'Neon DATABASE_URL is not configured or contains placeholder.';
    currentDbHost = 'Local In-Memory Cache';
    return false;
  }

  try {
    const urlObj = new URL(targetUrl);
    currentDbHost = urlObj.hostname || 'neon.tech';

    pool = new Pool({
      connectionString: targetUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db');
    isConnectedToNeon = true;
    lastErrorMessage = '';
    console.log(`[Neon PostgreSQL] Connected successfully to ${res.rows[0].db} on ${currentDbHost} at ${res.rows[0].current_time}`);

    // Auto-create schema if needed
    await ensureTablesExist();
    return true;
  } catch (err: any) {
    isConnectedToNeon = false;
    lastErrorMessage = err.message || 'Failed to connect to Neon PostgreSQL';
    console.warn(`[Neon PostgreSQL] Connection failed: ${lastErrorMessage}. Falling back to resilient storage.`);
    return false;
  }
};

const ensureTablesExist = async () => {
  if (!pool || !isConnectedToNeon) return;
  try {
    // Check if tables exist
    const checkRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'readings');
    `);

    if (checkRes.rows.length < 2) {
      console.log('[Neon PostgreSQL] Initializing database schema from schema.sql...');
      const schemaPath = path.resolve(process.cwd(), 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('[Neon PostgreSQL] Schema successfully initialized!');
      }
    }
  } catch (err) {
    console.error('[Neon PostgreSQL] Error ensuring schema exists:', err);
  }
};

// Generic query executor that works with Neon or resilient fallback
export const query = async (text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> => {
  if (pool && isConnectedToNeon) {
    try {
      const res = await pool.query(text, params);
      return { rows: res.rows || [], rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0) };
    } catch (err) {
      // Re-throw database error with query context
      throw err;
    }
  }

  // Fallback memory query handler for SELECT, INSERT, UPDATE, DELETE
  return executeMemoryQuery(text, params);
};

// Transaction Client helper
export const getClient = async () => {
  if (pool && isConnectedToNeon) {
    const client = await pool.connect();
    return client;
  }

  // Simulated transaction client
  return {
    query: async (text: string, params: any[] = []) => {
      return executeMemoryQuery(text, params);
    },
    release: () => {
      // no-op for memory
    },
  };
};

export const getDatabaseStatus = (): DBStatus => {
  return {
    provider: isConnectedToNeon ? 'Neon PostgreSQL' : 'Resilient In-Memory Storage',
    connected: isConnectedToNeon,
    databaseUrlConfigured: isNeonConfigured(),
    host: isConnectedToNeon ? currentDbHost : 'Local Resilient Engine',
    database: isConnectedToNeon ? 'neondb' : 'memory_db',
    message: isConnectedToNeon
      ? `Live SSL connection to Neon PostgreSQL (${currentDbHost}) active.`
      : lastErrorMessage || 'Operating in resilient mode. Configure DATABASE_URL in backend/.env to connect to live Neon.',
  };
};

// In-Memory SQL Interpreter for seamless offline and testing support
const executeMemoryQuery = async (text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> => {
  const normalized = text.replace(/\s+/g, ' ').trim();

  // Test connection query
  if (normalized.toUpperCase().includes('SELECT NOW()')) {
    return { rows: [{ current_time: new Date(), db: 'memory_db' }], rowCount: 1 };
  }

  // USERS QUERIES
  if (/INSERT\s+INTO\s+users/i.test(normalized)) {
    // $1 = name, $2 = email, $3 = password_hash
    const name = params[0];
    const email = params[1].toLowerCase();
    const password_hash = params[2];

    const exists = memoryUsers.some((u) => u.email === email);
    if (exists) {
      const err: any = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }

    const newUser: MemoryUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password_hash,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryUsers.push(newUser);
    return {
      rows: [{ id: newUser.id, name: newUser.name, email: newUser.email, created_at: newUser.created_at }],
      rowCount: 1,
    };
  }

  if (/SELECT\s+.*FROM\s+users\s+WHERE\s+LOWER\(email\)\s*=\s*LOWER\(\$1\)/i.test(normalized)) {
    const email = (params[0] || '').toLowerCase();
    const user = memoryUsers.find((u) => u.email.toLowerCase() === email);
    return { rows: user ? [{ ...user }] : [], rowCount: user ? 1 : 0 };
  }

  if (/SELECT\s+.*FROM\s+users\s+WHERE\s+id\s*=\s*\$1/i.test(normalized)) {
    const id = params[0];
    const user = memoryUsers.find((u) => u.id === id);
    if (!user) return { rows: [], rowCount: 0 };
    return {
      rows: [{ id: user.id, name: user.name, email: user.email, created_at: user.created_at }],
      rowCount: 1,
    };
  }

  // READINGS QUERIES

  // Count readings for user on date
  if (/SELECT\s+COUNT\(\*\)\s+AS\s+count\s+FROM\s+readings\s+WHERE\s+user_id\s*=\s*\$1\s+AND\s+reading_date\s*=\s*\$2/i.test(normalized)) {
    const userId = params[0];
    const date = params[1];
    const excludeId = params[2] || null;
    const count = memoryReadings.filter(
      (r) => r.user_id === userId && r.reading_date === date && (!excludeId || r.id !== excludeId)
    ).length;
    return { rows: [{ count: String(count) }], rowCount: 1 };
  }

  // Check specific slot reading
  if (/SELECT\s+id\s+FROM\s+readings\s+WHERE\s+user_id\s*=\s*\$1\s+AND\s+reading_date\s*=\s*\$2\s+AND\s+time_slot\s*=\s*\$3/i.test(normalized)) {
    const userId = params[0];
    const date = params[1];
    const slot = params[2];
    const excludeId = params[3] || null;
    const found = memoryReadings.find(
      (r) => r.user_id === userId && r.reading_date === date && r.time_slot === slot && (!excludeId || r.id !== excludeId)
    );
    return { rows: found ? [{ id: found.id }] : [], rowCount: found ? 1 : 0 };
  }

  // Insert reading
  if (/INSERT\s+INTO\s+readings/i.test(normalized)) {
    // $1 = user_id, $2 = reading_date, $3 = time_slot, $4 = glucose_value
    const userId = params[0];
    const readingDate = params[1];
    const timeSlot = params[2];
    const glucoseValue = Number(params[3]);

    // Check duplicate constraint
    const dup = memoryReadings.find((r) => r.user_id === userId && r.reading_date === readingDate && r.time_slot === timeSlot);
    if (dup) {
      const err: any = new Error('duplicate key value violates unique constraint "uq_user_date_slot"');
      err.code = '23505';
      throw err;
    }

    const newReading: MemoryReading = {
      id: crypto.randomUUID(),
      user_id: userId,
      reading_date: readingDate,
      time_slot: timeSlot,
      glucose_value: glucoseValue,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryReadings.push(newReading);
    return { rows: [{ ...newReading }], rowCount: 1 };
  }

  // Update reading
  if (/UPDATE\s+readings\s+SET/i.test(normalized)) {
    // $1 = reading_date, $2 = time_slot, $3 = glucose_value, $4 = id, $5 = user_id
    const readingDate = params[0];
    const timeSlot = params[1];
    const glucoseValue = Number(params[2]);
    const id = params[3];
    const userId = params[4];

    const idx = memoryReadings.findIndex((r) => r.id === id && r.user_id === userId);
    if (idx === -1) {
      return { rows: [], rowCount: 0 };
    }

    // Check unique slot conflict with other readings
    const dup = memoryReadings.find(
      (r) => r.id !== id && r.user_id === userId && r.reading_date === readingDate && r.time_slot === timeSlot
    );
    if (dup) {
      const err: any = new Error('duplicate key value violates unique constraint "uq_user_date_slot"');
      err.code = '23505';
      throw err;
    }

    memoryReadings[idx] = {
      ...memoryReadings[idx],
      reading_date: readingDate,
      time_slot: timeSlot,
      glucose_value: glucoseValue,
      updated_at: new Date(),
    };

    return { rows: [{ ...memoryReadings[idx] }], rowCount: 1 };
  }

  // Delete reading
  if (/DELETE\s+FROM\s+readings\s+WHERE\s+id\s*=\s*\$1\s+AND\s+user_id\s*=\s*\$2/i.test(normalized)) {
    const id = params[0];
    const userId = params[1];
    const initialLen = memoryReadings.length;
    memoryReadings = memoryReadings.filter((r) => !(r.id === id && r.user_id === userId));
    const deletedCount = initialLen - memoryReadings.length;
    return { rows: deletedCount > 0 ? [{ id }] : [], rowCount: deletedCount };
  }

  // Get single reading
  if (/SELECT\s+.*FROM\s+readings\s+WHERE\s+id\s*=\s*\$1\s+AND\s+user_id\s*=\s*\$2/i.test(normalized)) {
    const id = params[0];
    const userId = params[1];
    const item = memoryReadings.find((r) => r.id === id && r.user_id === userId);
    return { rows: item ? [{ ...item }] : [], rowCount: item ? 1 : 0 };
  }

  // Filter readings by date range or single date
  if (/SELECT\s+.*FROM\s+readings/i.test(normalized)) {
    const userId = params[0];
    let filtered = memoryReadings.filter((r) => r.user_id === userId);

    if (params.length >= 3 && /reading_date\s*>=\s*\$2\s+AND\s+reading_date\s*<=\s*\$3/i.test(normalized)) {
      const start = params[1];
      const end = params[2];
      filtered = filtered.filter((r) => r.reading_date >= start && r.reading_date <= end);
    } else if (params.length >= 2 && /reading_date\s*=\s*\$2/i.test(normalized)) {
      const date = params[1];
      filtered = filtered.filter((r) => r.reading_date === date);
    }

    // Sort by date DESC, then slot order
    const slotOrder: Record<string, number> = {
      'Morning (fasting)': 1,
      'After breakfast': 2,
      'After lunch': 3,
      'After dinner': 4,
    };

    filtered.sort((a, b) => {
      if (b.reading_date !== a.reading_date) {
        return b.reading_date.localeCompare(a.reading_date);
      }
      return (slotOrder[a.time_slot] || 0) - (slotOrder[b.time_slot] || 0);
    });

    return { rows: filtered.map((r) => ({ ...r })), rowCount: filtered.length };
  }

  return { rows: [], rowCount: 0 };
};

// Note: initDatabase() is called explicitly by server.ts bootstrap and CLI scripts.
