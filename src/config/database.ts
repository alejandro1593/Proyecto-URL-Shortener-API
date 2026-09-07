import dotenv from 'dotenv';
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
  connectionTimeoutMillis: 2000,
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
