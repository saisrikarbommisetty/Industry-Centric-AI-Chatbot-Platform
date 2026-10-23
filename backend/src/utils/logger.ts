import winston from 'winston';
import { ENV } from '../config/env';

// Safe sanitization helper to avoid logging passwords, api keys, or sensitive fields
const sanitizeLog = (info: any) => {
  const sensitiveKeys = [
    'password',
    'passwordHash',
    'token',
    'jwt',
    'apiKey',
    'openaiApiKey',
    'openai_api_key',
    'geminiApiKey',
    'secret',
    'authorization',
    'bearer',
  ];
  
  const cleanObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanObject);
    
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        cleaned[key] = cleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  return cleanObject(info);
};

export const logger = winston.createLogger({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const sanitized = sanitizeLog(info);
      const { timestamp, level, message, stack, ...meta } = sanitized;
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] [${level.toUpperCase()}]: ${message}${stack ? `\n${stack}` : ''}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
