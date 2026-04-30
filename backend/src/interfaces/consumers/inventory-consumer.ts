import { v4 as uuid } from 'uuid';
import type { PrismaClient } from '@prisma/client';
import { OrderStatus } from '@domain/enums.js';
import {
  EventTypes,
  type InventoryCancelledPayload,
  type InventoryConfirmedPayload,
  type PaymentConfirmedPayload,
} from '@domain/events/index.js';
import { logger } from '@shared/logger.js';
import type { IdempotencyStore } from '@application/ports/idempotency-store.js';
import type { ProductRepository } from '@application/ports/product-repository.js';
import type { RabbitMqPublisher } from '@infrastructure/messaging/rabbitmq-publisher.js';

export const INVENTORY_CONSUMER_NAME = 'inventory-reservation';

/**
 * Handler do consumer de estoque.
 *
 * Recebe payment.confirmed.
 *   - Tenta debitar estoque atomicamente (SELECT FOR UPDATE) via ProductRepository.
 *   - Sucesso: Order vira CONFIRMED + publica inventory.confirmed.
 *   - Estoque insuficiente: Order vira CANCELLED + publica inventory.cancelled.
 *
 * A atualização do Order acontece numa updateMany com WHERE status = PENDING_PAYMENT
 * (proteção contra reprocessamento em paralelo). Idempotência via ProcessedEvent.
 */
export function makeInventoryHandler(deps: {
  prisma: PrismaClient;
  products: ProductRepository;
  publisher: RabbitMqPublisher;
  idempotency: IdempotencyStore;
}) {
  return async (
    payload: unknown,
    ctx: { messageId: string; routingKey: string; attempts: number },
  ): Promise<void> => {
    const data = payload as PaymentConfirmedPayload;
    const log = logger.child({
      orderId: data.orderId,
      messageId: ctx.messageId,
      attempts: ctx.attempts,
    });

    if (await deps.idempotency.alreadyProcessed(ctx.messageId, INVENTORY_CONSUMER_NAME)) {
      log.info('Mensagem já processada anteriormente — ignorando.');
      return;
    }

    log.info('Processando reserva de estoque...');

    const result = await deps.products.debitStockBatch(data.items);

    if (result.ok) {
      // Atualiza pedido para CONFIRMED. Só atualiza se estiver em PENDING_PAYMENT.
      const updated = await deps.prisma.order.updateMany({
        where: { id: data.orderId, status: OrderStatus.PENDING_PAYMENT, deletedAt: null },
        data: { status: OrderStatus.CONFIRMED },
      });

      const event: InventoryConfirmedPayload = {
        orderId: data.orderId,
        customerId: data.customerId,
        occurredAt: new Date().toISOString(),
        items: data.items,
      };
      await deps.publisher.publish(EventTypes.INVENTORY_CONFIRMED, event, uuid());
      log.info({ rowsAffected: updated.count }, 'Estoque debitado e pedido CONFIRMED.');
    } else {
      const updated = await deps.prisma.order.updateMany({
        where: { id: data.orderId, status: OrderStatus.PENDING_PAYMENT, deletedAt: null },
        data: { status: OrderStatus.CANCELLED },
      });

      const event: InventoryCancelledPayload = {
        orderId: data.orderId,
        customerId: data.customerId,
        occurredAt: new Date().toISOString(),
        reason: 'Estoque insuficiente.',
        insufficientItems: result.insufficient,
      };
      await deps.publisher.publish(EventTypes.INVENTORY_CANCELLED, event, uuid());
      log.warn(
        { rowsAffected: updated.count, insufficient: result.insufficient },
        'Estoque insuficiente. Pedido CANCELLED.',
      );
    }

    await deps.idempotency.markProcessed(ctx.messageId, INVENTORY_CONSUMER_NAME);
  };
}
