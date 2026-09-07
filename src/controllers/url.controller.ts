import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as urlService from '../services/url.service';
import * as clickService from '../services/click.service';
import { ApiResponse } from '../utils/response';
import { getClientIp } from '../utils/helpers';

export const shortenUrl = async (req: AuthRequest, res: Response) => {
  const { originalUrl, customCode, expiresAt } = req.body;
  const url = await urlService.createUrl({
    originalUrl,
    customCode,
    expiresAt,
    userId: req.userId!,
  });
  ApiResponse.created(res, url, 'URL shortened successfully');
};

export const getUrls = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string | undefined;

  const result = await urlService.getUserUrls(req.userId!, page, limit, search);
  ApiResponse.success(res, result);
};

export const getUrlById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const url = await urlService.getUrlById(id, req.userId!);
  ApiResponse.success(res, url);
};

export const updateUrl = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { originalUrl } = req.body;
  const url = await urlService.updateUrl(id, req.userId!, originalUrl);
  ApiResponse.success(res, url, 'URL updated successfully');
};

export const deleteUrl = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await urlService.deleteUrl(id, req.userId!);
  ApiResponse.success(res, null, 'URL deleted successfully');
};

export const redirectUrl = async (req: any, res: Response) => {
  const { shortCode } = req.params;
  const url = await urlService.getUrlByShortCode(shortCode);

  if (!url) {
    return res.status(404).json({ error: 'URL not found' });
  }

  // Record click asynchronously (don't block the redirect)
  clickService.recordClick({
    urlId: url.id,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
  }).catch(console.error);

  res.redirect(302, url.original_url);
};
