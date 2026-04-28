import type { PrismaClient } from '@prisma/client';
import type { IdempotencyStore } from '@application/ports/idempotency-store.js';

/**
 * Implementação simples baseada em UPSERT na tabela processed_events.
 * Usa o messageId como PK (único globalmente). O campo "consumer" identifica
 * qual consumidor processou — útil quando múltiplos consumers leem o mesmo evento.
 */
export class PrismaIdempotencyStore implements IdempotencyStore {
  constructor(private readonly prisma: PrismaClient) {}

  async alreadyProcessed(messageId: string, consumer: string): Promise<boolean> {
    const found = await this.prisma.processedEvent.findUnique({ where: { messageId } });
    return !!found && found.consumer === consumer;
  }

  async markProcessed(messageId: string, consumer: string): Promise<void> {
    // upsert para evitar erro de unique se 2 mensagens com mesmo id chegarem em paralelo
    await this.prisma.processedEvent.upsert({
      where: { messageId },
      create: { messageId, consumer },
      update: { consumer },
    });
  }
}
