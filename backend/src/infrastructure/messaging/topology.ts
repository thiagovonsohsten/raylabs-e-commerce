/**
 * Topologia única do RabbitMQ — declarada uma vez no startup de cada serviço.
 *
 * Exchanges:
 *   - orders.events  (topic)            → exchange principal
 *   - orders.retry   (x-delayed-message)→ delay para retry exponencial
 *   - orders.dlx     (topic)            → dead-letter exchange
 *
 * Filas (cada uma tem .dlq):
 *   - payment.process       ← order.created
 *   - inventory.reserve     ← payment.confirmed
 *   - order.status.updater  ← payment.confirmed | payment.failed | inventory.confirmed | inventory.cancelled
 *
 * Quando consumer dá nack após N tentativas, o wrapper republica em orders.retry
 * com header x-delay = base * 2^attempts. A mensagem volta após o delay e é
 * reentregue na fila original. Após esgotar tentativas, vai para a fila .dlq.
 */
import { EventTypes } from '@domain/events/index.js';

export const Exchanges = {
  EVENTS: 'orders.events',
  RETRY: 'orders.retry',
  DLX: 'orders.dlx',
} as const;

export const Queues = {
  PAYMENT_PROCESS: 'payment.process',
  INVENTORY_RESERVE: 'inventory.reserve',
  ORDER_STATUS_UPDATER: 'order.status.updater',
} as const;

export const Bindings = {
  [Queues.PAYMENT_PROCESS]: [EventTypes.ORDER_CREATED],
  [Queues.INVENTORY_RESERVE]: [EventTypes.PAYMENT_CONFIRMED],
  [Queues.ORDER_STATUS_UPDATER]: [
    EventTypes.PAYMENT_CONFIRMED,
    EventTypes.PAYMENT_FAILED,
    EventTypes.INVENTORY_CONFIRMED,
    EventTypes.INVENTORY_CANCELLED,
  ],
} as const;

export const dlqName = (queue: string): string => `${queue}.dlq`;
