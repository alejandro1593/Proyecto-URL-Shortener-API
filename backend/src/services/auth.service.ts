import { pool } from '../config/database';
import { createError } from '../middleware/errorHandler';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
} from '../utils/helpers';

interface CreateUserParams {
  fullName: string;
  email: string;
  password: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

export const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<UserRow | null> => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createUser = async ({ fullName, email, password }: CreateUserParams) => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw createError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, full_name, email, role, created_at`,
    [fullName, email, passwordHash]
  );

  const user = result.rows[0];
  const accessToken = generateToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [user.id, refreshToken]
  );

  return { user, accessToken, refreshToken };
};

export const authenticateUser = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    throw createError('Account is deactivated', 403);
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw createError('Invalid email or password', 401);
  }

  const accessToken = generateToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [user.id, refreshToken]
  );

  return {
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token: string) => {
  const result = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    throw createError('Invalid or expired refresh token', 401);
  }

  const refreshTokenRow = result.rows[0];
  const user = await findUserById(refreshTokenRow.user_id);
  if (!user || !user.is_active) {
    throw createError('User not found or deactivated', 401);
  }

  // Revoke the old refresh token
  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [refreshTokenRow.id]);

  // Generate new tokens
  const newAccessToken = generateToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [user.id, newRefreshToken]
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const revokeRefreshToken = async (userId: string) => {
  await pool.query(
    'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false',
    [userId]
  );
};
