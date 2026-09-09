import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'url_shortener',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(process.env.DB_SSL === 'true'
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

// Test connection on startup
export const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`[DB] Connected. Time: ${res.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('[DB] Connection failed:', err);
    return false;
  }
};

// Apply schema.sql (idempotent CREATE TABLE IF NOT EXISTS). Searches the
// schema in dev (src/config), built output (dist/..) and repo root so it
// works with ts-node-dev, `npm start` and cloud deploys alike.
export const initSchema = async (): Promise<boolean> => {
  const candidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '..', 'config', 'schema.sql'),
    path.join(process.cwd(), 'src', 'config', 'schema.sql'),
  ];

  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    console.error(
      '[DB] Schema file not found. Looked at:',
      candidates.join(', '),
    );
    return false;
  }

  try {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('[DB] Schema applied (tables ready)');
    return true;
  } catch (err) {
    console.error('[DB] Schema apply failed:', err);
    return false;
  }
};
