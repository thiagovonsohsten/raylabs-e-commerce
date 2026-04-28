import type { PrismaClient } from '@prisma/client';
import { OutboxEventStatus } from '@domain/enums.js';
import { logger } from '@shared/logger.js';
import type { RabbitMqPublisher } from '@infrastructure/messaging/rabbitmq-publisher.js';

/**
 * Worker de Outbox Relay.
 *
 * Algoritmo (executado a cada `pollIntervalMs`):
 *   1) Seleciona até `batchSize` eventos PENDING (FIFO).
 *   2) Para cada evento:
 *      - publica no RabbitMQ usando o type como routing key
 *      - marca como PUBLISHED em caso de sucesso
 *      - incrementa attempts e marca FAILED com lastError em caso de erro
 *
 * O messageId publicado coincide com o id do OutboxEvent (idempotência ponta-a-ponta).
 *
 * Garantias: at-least-once. Os consumers usam ProcessedEvent para deduplicar.
 */
export interface OutboxRelayConfig {
  pollIntervalMs: number;
  batchSize: number;
}

export class OutboxRelay {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly publisher: RabbitMqPublisher,
    private readonly config: OutboxRelayConfig,
  ) {}

  start(): void {
    logger.info({ ...this.config }, 'Outbox relay iniciado.');
    this.scheduleNext();
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleNext(): void {
    this.timer = setTimeout(() => {
      void this.tick();
    }, this.config.pollIntervalMs);
  }

  private async tick(): Promise<void> {
    if (this.running) {
      this.scheduleNext();
      return;
    }
    this.running = true;
    try {
      await this.processBatch();
    } catch (err) {
      logger.error({ err }, 'Erro no ciclo do outbox relay.');
    } finally {
      this.running = false;
      this.scheduleNext();
    }
  }

  private async processBatch(): Promise<void> {
    const pending = await this.prisma.outboxEvent.findMany({
      where: { status: OutboxEventStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: this.config.batchSize,
    });

    if (pending.length === 0) return;

    logger.debug({ count: pending.length }, 'Processando lote do outbox.');

    for (const event of pending) {
      try {
        await this.publisher.publish(event.type, event.payload as object, event.id);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxEventStatus.PUBLISHED,
            publishedAt: new Date(),
            attempts: { increment: 1 },
          },
        });
        logger.info(
          { eventId: event.id, type: event.type, aggregateId: event.aggregateId },
          'Evento publicado.',
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            lastError: errMsg.slice(0, 500),
            // Mantém PENDING para tentar novamente no próximo ciclo
          },
        });
        logger.error({ err, eventId: event.id }, 'Falha ao publicar evento do outbox.');
      }
    }
  }
}
