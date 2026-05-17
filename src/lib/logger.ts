// Simple logger that respects NODE_ENV
// In production, only errors are logged; in development, everything

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: unknown[]) => {
    if (!isProduction) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (!isProduction) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
} as const;
