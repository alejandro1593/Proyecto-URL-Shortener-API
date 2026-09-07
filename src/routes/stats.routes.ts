import { Router } from 'express';
import {
  getOverview,
  getUrlStats,
  getClicksByDay,
  getTopUrls,
} from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { getOverviewSchema, getUrlAnalyticsSchema } from '../models/stats.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Todas las rutas de estadísticas requieren autenticación
router.use(authenticate);

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Resumen general de estadísticas del usuario
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Resumen de estadísticas
 */
router.get('/overview', validate(getOverviewSchema), asyncHandler(getOverview));

/**
 * @swagger
 * /api/stats/urls/{id}:
 *   get:
 *     summary: Estadísticas de una URL específica
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estadísticas de la URL
 */
router.get('/urls/:id', validate(getUrlAnalyticsSchema), asyncHandler(getUrlStats));

/**
 * @swagger
 * /api/stats/clicks-by-day:
 *   get:
 *     summary: Clicks por día del usuario
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clicks agregados por día
 */
router.get('/clicks-by-day', asyncHandler(getClicksByDay));

/**
 * @swagger
 * /api/stats/top-urls:
 *   get:
 *     summary: Top 10 URLs más visitadas
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URLs ordenadas por clicks
 */
router.get('/top-urls', asyncHandler(getTopUrls));

export default router;
