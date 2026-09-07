import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

// Generar token JWT
const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export const generateToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn }
  );
};

// Generar refresh token
export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '30d' }
  );
};

// Encriptar contraseña
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Comparar contraseña
export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};

// Generar código corto único para URLs
const shortCodeAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shortCodeGenerator = customAlphabet(shortCodeAlphabet, 7);

export const generateShortCode = (length: number = 7) => {
  if (length === 7) return shortCodeGenerator();
  const generate = customAlphabet(shortCodeAlphabet, length);
  return generate();
};

// Validar que una URL tenga protocolo
export const normalizeUrl = (url: string) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// Obtener IP del request (considerando proxies)
export const getClientIp = (req: any) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.ip || 'unknown';
};
