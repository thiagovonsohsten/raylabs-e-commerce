import pino from 'pino';

/**
 * Logger estruturado em JSON (pino).
 * Todo serviço usa o mesmo logger; em dev usa pino-pretty.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          colorize: true,
        },
      }
    : undefined,
  base: {
    service: process.env.SERVICE_NAME ?? 'raylabs',
  },
});

export type Logger = typeof logger;
