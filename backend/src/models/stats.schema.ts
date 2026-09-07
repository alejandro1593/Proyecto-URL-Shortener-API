import { z } from 'zod';

export const getOverviewSchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

export const getUrlAnalyticsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid URL ID'),
  }),
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});
