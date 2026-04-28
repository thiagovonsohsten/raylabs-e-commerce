import { execSync } from 'node:child_process';
import { afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

/**
 * Setup compartilhado dos testes de integração.
 *
 * Pré-requisito: PostgreSQL rodando em DATABASE_URL (default localhost:5432).
 * Antes de cada arquivo de teste, executa migrate deploy + truncate das tabelas.
 *
 * Não usamos testcontainers para manter execução simples no ambiente local —
 * o usuário pode subir o banco com `docker compose up -d postgres`.
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://raylabs:raylabs@localhost:5432/raylabs?schema=public';

export const testPrisma = new PrismaClient();

beforeAll(async () => {
  // Garante migrations aplicadas
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  } catch {
    // Se falhar, segue — talvez já estejam aplicadas
  }
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

export async function resetDatabase() {
  await testPrisma.$executeRawUnsafe(
    'TRUNCATE TABLE "processed_events", "outbox_events", "order_items", "orders", "products", "customers" RESTART IDENTITY CASCADE',
  );
}
