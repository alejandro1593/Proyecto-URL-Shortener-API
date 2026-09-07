import { pool } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

interface RecordClickParams {
  urlId: string;
  ip: string;
  userAgent?: string;
  referer?: string;
}

export const recordClick = async ({ urlId, ip, userAgent, referer }: RecordClickParams) => {
  const device = parseDevice(userAgent);
  const browser = parseBrowser(userAgent);

  await pool.query(
    `INSERT INTO clicks (url_id, ip_address, user_agent, device, browser, referer)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [urlId, ip, userAgent || null, device, browser, referer || null]
  );

  await pool.query(
    'UPDATE urls SET click_count = click_count + 1 WHERE id = $1',
    [urlId]
  );
};

export const getClicksByDay = async (userId: string, days = 30) => {
  const cacheKey = `clicks_by_day:${userId}:${days}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await pool.query(
    `SELECT
       DATE(c.created_at) AS date,
       COUNT(*)::int AS clicks
     FROM clicks c
     JOIN urls u ON c.url_id = u.id
     WHERE u.user_id = $1
       AND c.created_at >= NOW() - ($2 || ' days')::INTERVAL
     GROUP BY DATE(c.created_at)
     ORDER BY date ASC`,
    [userId, days]
  );

  const data = result.rows;
  await cacheSet(cacheKey, JSON.stringify(data), 300);
  return data;
};

export const getTopUrls = async (userId: string, limit = 10) => {
  const cacheKey = `top_urls:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await pool.query(
    `SELECT
       u.id,
       u.short_code AS "shortCode",
       u.original_url AS "originalUrl",
       u.click_count AS "clickCount"
     FROM urls u
     WHERE u.user_id = $1 AND u.is_active = true
     ORDER BY u.click_count DESC
     LIMIT $2`,
    [userId, limit]
  );

  const data = result.rows;
  await cacheSet(cacheKey, JSON.stringify(data), 300);
  return data;
};

const parseDevice = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

const parseBrowser = (userAgent?: string): string => {
  if (!userAgent) return 'unknown';
  if (/chrome/i.test(userAgent)) return 'chrome';
  if (/firefox/i.test(userAgent)) return 'firefox';
  if (/safari/i.test(userAgent)) return 'safari';
  if (/edge/i.test(userAgent)) return 'edge';
  if (/opera|opr/i.test(userAgent)) return 'opera';
  return 'other';
};
