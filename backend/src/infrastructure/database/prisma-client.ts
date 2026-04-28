import { PrismaClient } from '@prisma/client';

/**
 * Singleton do PrismaClient. Evita explosão de conexões em hot-reload e workers.
 */
let instance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!instance) {
    instance = new PrismaClient({
      log: process.env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }
  return instance;
}

export async function disconnectPrisma(): Promise<void> {
  if (instance) {
    await instance.$disconnect();
    instance = null;
  }
}
