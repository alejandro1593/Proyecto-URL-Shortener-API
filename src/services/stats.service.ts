import { pool } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

interface DateRange {
  from?: string;
  to?: string;
}

const buildDateFilter = (alias: string, range?: DateRange) => {
  const conditions: string[] = [];
  const params: any[] = [];

  if (range?.from) {
    params.push(range.from);
    conditions.push(`${alias}.created_at >= $${params.length}`);
  }
  if (range?.to) {
    params.push(range.to);
    conditions.push(`${alias}.created_at <= $${params.length}`);
  }

  return { conditions, params };
};

export const getOverview = async (userId: string, range?: DateRange) => {
  const cacheKey = `stats:overview:${userId}:${JSON.stringify(range)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const { conditions, params } = buildDateFilter('c', range);
  const urlConditions: string[] = ['u.user_id = $1'];
  const urlParams: any[] = [userId];

  if (conditions.length > 0) {
    const offset = urlParams.length;
    conditions.forEach((cond, i) => {
      urlConditions.push(cond.replace(/\$\d+/g, () => `$${offset + i + 1}`));
    });
    urlParams.push(...params);
  }

  const whereClause = urlConditions.join(' AND ');

  const totalUrlsResult = await pool.query(
    'SELECT COUNT(*)::int AS "totalUrls" FROM urls u WHERE u.user_id = $1',
    [userId]
  );

  const totalClicksResult = await pool.query(
    `SELECT COUNT(*)::int AS "totalClicks"
     FROM clicks c
     JOIN urls u ON c.url_id = u.id
     WHERE ${whereClause}`,
    urlParams
  );

  const avgClicksResult = await pool.query(
    `SELECT COALESCE(ROUND(AVG(u.click_count), 1), 0)::float AS "avgClicksPerUrl"
     FROM urls u
     WHERE u.user_id = $1`,
    [userId]
  );

  const topUrlResult = await pool.query(
    `SELECT u.short_code AS "shortCode", u.click_count AS "clickCount"
     FROM urls u
     WHERE u.user_id = $1 AND u.is_active = true
     ORDER BY u.click_count DESC
     LIMIT 1`,
    [userId]
  );

  const clicksTodayResult = await pool.query(
    `SELECT COUNT(*)::int AS "clicksToday"
     FROM clicks c
     JOIN urls u ON c.url_id = u.id
     WHERE u.user_id = $1 AND DATE(c.created_at) = CURRENT_DATE`,
    [userId]
  );

  const overview = {
    totalUrls: totalUrlsResult.rows[0].totalUrls,
    totalClicks: totalClicksResult.rows[0].totalClicks,
    avgClicksPerUrl: avgClicksResult.rows[0].avgClicksPerUrl,
    clicksToday: clicksTodayResult.rows[0].clicksToday,
    topUrl: topUrlResult.rows[0] || null,
  };

  await cacheSet(cacheKey, JSON.stringify(overview), 60);
  return overview;
};

export const getUrlStats = async (urlId: string, userId: string, range?: DateRange) => {
  const urlResult = await pool.query(
    'SELECT * FROM urls WHERE id = $1 AND user_id = $2',
    [urlId, userId]
  );

  if (urlResult.rows.length === 0) {
    return null;
  }

  const url = urlResult.rows[0];
  const { conditions, params } = buildDateFilter('c', range);

  const baseParams = [urlId];
  const allParams = [...baseParams, ...params];
  const whereClause = `c.url_id = $1${conditions.length > 0 ? ' AND ' + conditions.map(c => c.replace(/\$\d+/g, (_, num) => `$${parseInt(num) + baseParams.length}`)).join(' AND ') : ''}`;

  const clicksByDevice = await pool.query(
    `SELECT c.device, COUNT(*)::int AS count
     FROM clicks c
     WHERE ${whereClause}
     GROUP BY c.device
     ORDER BY count DESC`,
    allParams
  );

  const clicksByBrowser = await pool.query(
    `SELECT c.browser, COUNT(*)::int AS count
     FROM clicks c
     WHERE ${whereClause}
     GROUP BY c.browser
     ORDER BY count DESC`,
    allParams
  );

  const clicksByDay = await pool.query(
    `SELECT DATE(c.created_at) AS date, COUNT(*)::int AS count
     FROM clicks c
     WHERE ${whereClause}
     GROUP BY DATE(c.created_at)
     ORDER BY date ASC`,
    allParams
  );

  const recentClicks = await pool.query(
    `SELECT c.ip_address, c.device, c.browser, c.referer, c.created_at
     FROM clicks c
     WHERE ${whereClause}
     ORDER BY c.created_at DESC
     LIMIT 20`,
    allParams
  );

  return {
    url: {
      id: url.id,
      originalUrl: url.original_url,
      shortCode: url.short_code,
      clickCount: url.click_count,
      createdAt: url.created_at,
    },
    analytics: {
      clicksByDevice: clicksByDevice.rows,
      clicksByBrowser: clicksByBrowser.rows,
      clicksByDay: clicksByDay.rows,
      recentClicks: recentClicks.rows,
    },
  };
};
