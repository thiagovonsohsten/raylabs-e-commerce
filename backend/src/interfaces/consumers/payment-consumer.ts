import { v4 as uuid } from 'uuid';
import type { PrismaClient } from '@prisma/client';
import { OrderStatus } from '@domain/enums.js';
import {
  EventTypes,
  type OrderCreatedPayload,
  type PaymentConfirmedPayload,
  type PaymentFailedPayload,
} from '@domain/events/index.js';
import { logger } from '@shared/logger.js';
import type { IdempotencyStore } from '@application/ports/idempotency-store.js';
import type { RabbitMqPublisher } from '@infrastructure/messaging/rabbitmq-publisher.js';

export interface PaymentConsumerConfig {
  successRate: number;
  processingMs: number;
}

export const PAYMENT_CONSUMER_NAME = 'payment-processor';

/**
 * Handler do consumer de pagamento.
 *
 * Recebe order.created e simula processamento de pagamento.
 *   - Sucesso (com taxa configurável): publica payment.confirmed.
 *   - Falha: publica payment.failed e atualiza Order para PAYMENT_FAILED.
 *
 * Idempotência: se a mesma mensagem (messageId) já foi processada, ignora.
 */
export function makePaymentHandler(deps: {
  prisma: PrismaClient;
  publisher: RabbitMqPublisher;
  idempotency: IdempotencyStore;
  config: PaymentConsumerConfig;
}) {
  return async (
    payload: unknown,
    ctx: { messageId: string; routingKey: string; attempts: number },
  ): Promise<void> => {
    const data = payload as OrderCreatedPayload;
    const log = logger.child({
      orderId: data.orderId,
      messageId: ctx.messageId,
      attempts: ctx.attempts,
    });

    if (await deps.idempotency.alreadyProcessed(ctx.messageId, PAYMENT_CONSUMER_NAME)) {
      log.info('Mensagem já processada anteriormente — ignorando.');
      return;
    }

    log.info('Processando pagamento...');

    // Simula latência do gateway de pagamento
    if (deps.config.processingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, deps.config.processingMs));
    }

    const success = Math.random() < deps.config.successRate;

    if (success) {
      const event: PaymentConfirmedPayload = {
        orderId: data.orderId,
        customerId: data.customerId,
        occurredAt: new Date().toISOString(),
        total: data.total,
        items: data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
      await deps.publisher.publish(EventTypes.PAYMENT_CONFIRMED, event, uuid());
      log.info('Pagamento aprovado. payment.confirmed publicado.');
    } else {
      const reason = 'Pagamento recusado pela operadora (simulado).';
      const event: PaymentFailedPayload = {
        orderId: data.orderId,
        customerId: data.customerId,
        occurredAt: new Date().toISOString(),
        reason,
      };
      // Atualiza pedido para PAYMENT_FAILED. Só atualiza se ainda estiver em PENDING_PAYMENT.
      await deps.prisma.order.updateMany({
        where: { id: data.orderId, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PAYMENT_FAILED },
      });
      await deps.publisher.publish(EventTypes.PAYMENT_FAILED, event, uuid());
      log.warn({ reason }, 'Pagamento recusado. payment.failed publicado.');
    }

    await deps.idempotency.markProcessed(ctx.messageId, PAYMENT_CONSUMER_NAME);
  };
}
