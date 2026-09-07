import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Determinar entorno
const getEnv = () => process.env.NODE_ENV || 'development';

// Log levels: error > warn > info > debug
const LOG_LEVELS: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const getLevel = () => {
  const configured = process.env.LOG_LEVEL || 'info';
  return LOG_LEVELS[configured] !== undefined ? LOG_LEVELS[configured] : 2;
};

const colorize = (level: string, message: string): string => {
  const colors: Record<string, string> = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    debug: '\x1b[32m',
  };
  const color = colors[level] || '\x1b[0m';
  return `${color}${message}\x1b[0m`;
};

const writeLog = (level: string, message: string, meta?: any) => {
  const levelNum = LOG_LEVELS[level] ?? 1;
  if (levelNum > getLevel()) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  // Imprimir en consola
  if (getEnv() !== 'test') {
    if (level === 'error' || level === 'warn') {
      console.error(colorize(level, `${prefix} ${message}`));
    } else {
      console.log(colorize(level, `${prefix} ${message}`));
    }

    if (meta) {
      console.log(colorize(level, `${prefix} ${JSON.stringify(meta)}`));
    }
  }

  // Guardar en archivo .log
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(
    logDir,
    `${new Date().toISOString().split('T')[0]}.log`
  );
  const logContent = `${prefix} ${message}${meta ? ' | ' + JSON.stringify(meta) : ''}\n`;
  fs.appendFileSync(logFile, logContent);
};

export const logger = {
  error: (message: string, meta?: any) => writeLog('error', message, meta),
  warn: (message: string, meta?: any) => writeLog('warn', message, meta),
  info: (message: string, meta?: any) => writeLog('info', message, meta),
  debug: (message: string, meta?: any) => writeLog('debug', message, meta),
};
