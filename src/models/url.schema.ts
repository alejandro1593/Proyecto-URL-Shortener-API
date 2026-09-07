import { z } from 'zod';

export const createUrlSchema = z.object({
  body: z.object({
    originalUrl: z.string().url('Invalid URL format'),
    customCode: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{3,10}$/, 'Custom code must be 3-10 alphanumeric characters')
      .optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export const getUrlStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid URL ID'),
  }),
});

export const updateUrlSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid URL ID'),
  }),
  body: z.object({
    originalUrl: z.string().url('Invalid URL format'),
  }),
});

export const getUrlsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
  }),
});
