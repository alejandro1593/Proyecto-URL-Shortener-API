import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as statsService from '../services/stats.service';
import * as clickService from '../services/click.service';
import { ApiResponse } from '../utils/response';

export const getOverview = async (req: AuthRequest, res: Response) => {
  const { from, to } = req.query;
  const overview = await statsService.getOverview(req.userId!, {
    from: from as string,
    to: to as string,
  });
  ApiResponse.success(res, overview);
};

export const getUrlStats = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { from, to } = req.query;

  const stats = await statsService.getUrlStats(id, req.userId!, {
    from: from as string,
    to: to as string,
  });

  if (!stats) {
    return ApiResponse.error(res, 'URL not found', 404);
  }

  ApiResponse.success(res, stats);
};

export const getClicksByDay = async (req: AuthRequest, res: Response) => {
  const clicks = await clickService.getClicksByDay(req.userId!);
  ApiResponse.success(res, clicks);
};

export const getTopUrls = async (req: AuthRequest, res: Response) => {
  const topUrls = await clickService.getTopUrls(req.userId!);
  ApiResponse.success(res, topUrls);
};
