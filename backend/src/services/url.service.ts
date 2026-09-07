import { pool } from '../config/database';
import { cacheGet, cacheSet, cacheDelete } from '../config/redis';
import { createError } from '../middleware/errorHandler';
import { generateShortCode, normalizeUrl } from '../utils/helpers';

interface CreateUrlParams {
  originalUrl: string;
  customCode?: string;
  expiresAt?: string;
  userId: string;
}

interface UrlRow {
  id: string;
  user_id: string;
  original_url: string;
  short_code: string;
  title: string | null;
  expires_at: Date | null;
  is_active: boolean;
  click_count: number;
  created_at: Date;
  updated_at: Date;
}

export const createUrl = async ({
  originalUrl,
  customCode,
  expiresAt,
  userId,
}: CreateUrlParams) => {
  const normalizedUrl = normalizeUrl(originalUrl);
  const shortCode = customCode || generateShortCode();

  // Check if custom code is already taken
  if (customCode) {
    const existing = await pool.query(
      'SELECT id FROM urls WHERE short_code = $1',
      [customCode]
    );
    if (existing.rows.length > 0) {
      throw createError('Custom code is already taken', 409);
    }
  }

  const result = await pool.query(
    `INSERT INTO urls (user_id, original_url, short_code, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, normalizedUrl, shortCode, expiresAt || null]
  );

  const url = result.rows[0];
  await cacheSet(`url:${shortCode}`, JSON.stringify(url), 3600);

  return formatUrl(url);
};

export const getUserUrls = async (
  userId: string,
  page = 1,
  limit = 10,
  search?: string
) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM urls WHERE user_id = $1';
  const params: any[] = [userId];

  if (search) {
    query += ` AND (original_url ILIKE $${params.length + 1} OR short_code ILIKE $${params.length + 1} OR title ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }

  const countResult = await pool.query(
    query.replace('SELECT *', 'SELECT COUNT(*)'),
    params
  );
  const total = parseInt(countResult.rows[0].count);

  query += ' ORDER BY created_at DESC';
  params.push(limit, offset);
  query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const result = await pool.query(query, params);

  return {
    data: result.rows.map(formatUrl),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const getUrlById = async (id: string, userId: string) => {
  const result = await pool.query(
    'SELECT * FROM urls WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw createError('URL not found', 404);
  }

  return formatUrl(result.rows[0]);
};

export const getUrlByShortCode = async (shortCode: string) => {
  // Try cache first
  const cached = await cacheGet(`url:${shortCode}`);
  if (cached) {
    return JSON.parse(cached) as UrlRow;
  }

  const result = await pool.query(
    'SELECT * FROM urls WHERE short_code = $1 AND is_active = true',
    [shortCode]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const url = result.rows[0];
  await cacheSet(`url:${shortCode}`, JSON.stringify(url), 3600);

  return url;
};

export const updateUrl = async (id: string, userId: string, originalUrl: string) => {
  const normalizedUrl = normalizeUrl(originalUrl);
  const result = await pool.query(
    `UPDATE urls SET original_url = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [normalizedUrl, id, userId]
  );

  if (result.rows.length === 0) {
    throw createError('URL not found', 404);
  }

  const url = result.rows[0];
  await cacheDelete(`url:${url.short_code}`);
  await cacheSet(`url:${url.short_code}`, JSON.stringify(url), 3600);

  return formatUrl(url);
};

export const deleteUrl = async (id: string, userId: string) => {
  const result = await pool.query(
    'DELETE FROM urls WHERE id = $1 AND user_id = $2 RETURNING short_code',
    [id, userId]
  );

  if (result.rows.length === 0) {
    throw createError('URL not found', 404);
  }

  await cacheDelete(`url:${result.rows[0].short_code}`);
  return true;
};

const formatUrl = (url: UrlRow) => ({
  id: url.id,
  originalUrl: url.original_url,
  shortCode: url.short_code,
  title: url.title,
  expiresAt: url.expires_at,
  isActive: url.is_active,
  clickCount: url.click_count,
  createdAt: url.created_at,
  updatedAt: url.updated_at,
});
