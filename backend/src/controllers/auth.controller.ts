import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';
import { ApiResponse } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;
  const result = await authService.createUser({ fullName, email, password });
  ApiResponse.created(res, result, 'Account created successfully');
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.authenticateUser(email, password);
  ApiResponse.success(res, result, 'Login successful');
};

export const logout = async (req: AuthRequest, res: Response) => {
  if (req.userId) {
    await authService.revokeRefreshToken(req.userId);
  }
  ApiResponse.success(res, null, 'Logged out successfully');
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  ApiResponse.success(res, result, 'Token refreshed successfully');
};
