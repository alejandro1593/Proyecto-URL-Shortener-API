import { Router } from 'express';
import {
  shortenUrl,
  getUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
} from '../controllers/url.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { urlCreationLimiter } from '../middleware/rateLimit.middleware';
import {
  createUrlSchema,
  getUrlStatsSchema,
  updateUrlSchema,
  getUrlsSchema,
} from '../models/url.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Todas las rutas de URLs requieren autenticación
router.use(authenticate);

/**
 * @swagger
 * /api/urls:
 *   post:
 *     summary: Acortar una URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalUrl]
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: url
 *               customCode:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: URL acortada correctamente
 *       400:
 *         description: Datos inválidos
 *       429:
 *         description: Límite de creación alcanzado
 */
router.post('/', urlCreationLimiter, validate(createUrlSchema), asyncHandler(shortenUrl));

/**
 * @swagger
 * /api/urls:
 *   get:
 *     summary: Listar URLs del usuario (con paginación)
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de URLs
 */
router.get('/', validate(getUrlsSchema), asyncHandler(getUrls));

/**
 * @swagger
 * /api/urls/{id}:
 *   get:
 *     summary: Obtener detalle de una URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detalle de la URL
 *       404:
 *         description: URL no encontrada
 */
router.get('/:id', validate(getUrlStatsSchema), asyncHandler(getUrlById));

/**
 * @swagger
 * /api/urls/{id}:
 *   patch:
 *     summary: Actualizar la URL original
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [originalUrl]
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: URL actualizada
 */
router.patch('/:id', validate(updateUrlSchema), asyncHandler(updateUrl));

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     summary: Eliminar una URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: URL eliminada
 *       404:
 *         description: URL no encontrada
 */
router.delete('/:id', validate(getUrlStatsSchema), asyncHandler(deleteUrl));

export default router;
