import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import urlRoutes from './routes/url.routes';
import statsRoutes from './routes/stats.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger.middleware';
import { redirectUrl } from './controllers/url.controller';
import { redirectLimiter } from './middleware/rateLimit.middleware';
import { asyncHandler } from './utils/asyncHandler';

// Create Express app
const app = express();

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description: 'API REST para acortar URLs con analytics y caching',
      contact: {
        name: 'Eduard Alejandro Vega Diaz',
        email: 'alejandrovega.1593@gmail.com',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/stats', statsRoutes);

// Resolve frontend static folder relative to this file (src -> ../frontend,
// dist -> ../../frontend) so it works in dev and production.
const FRONTEND_CANDIDATES = [
  path.join(__dirname, '..', 'frontend'),
  path.join(__dirname, '..', '..', 'frontend'),
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), '..', 'frontend'),
];
const FRONTEND_DIR = FRONTEND_CANDIDATES.find((p) => {
  try {
    return fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
}) || process.cwd();

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve the static frontend (SPA) before the redirect catch-all
app.use(express.static(FRONTEND_DIR));

// Redirect handler (short URL -> original URL)
app.get('/:shortCode', redirectLimiter, asyncHandler(redirectUrl));

// Error handling middleware
app.use(errorHandler);

export default app;
