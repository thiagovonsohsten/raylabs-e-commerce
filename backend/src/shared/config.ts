import { z } from 'zod';

/**
 * Validação centralizada de variáveis de ambiente.
 * Falha rápido (fail-fast) se alguma variável obrigatória estiver ausente ou inválida.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('1d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PAYMENT_SUCCESS_RATE: z.coerce.number().min(0).max(1).default(0.9),
  PAYMENT_PROCESSING_MS: z.coerce.number().int().nonnegative().default(500),
  MAX_DELIVERY_ATTEMPTS: z.coerce.number().int().positive().default(4),
  RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(1000),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(20),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Configuração inválida: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
