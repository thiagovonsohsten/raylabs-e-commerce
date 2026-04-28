/**
 * Tipos de eventos publicados no broker. Coincidem com routing keys do RabbitMQ.
 *
 * Convenção: <agregado>.<verbo no passado>
 */
export const EventTypes = {
  ORDER_CREATED: 'order.created',
  PAYMENT_CONFIRMED: 'payment.confirmed',
  PAYMENT_FAILED: 'payment.failed',
  INVENTORY_CONFIRMED: 'inventory.confirmed',
  INVENTORY_CANCELLED: 'inventory.cancelled',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// Payload base — todo evento carrega o id do pedido (aggregate root).
export interface BaseEventPayload {
  orderId: string;
  customerId: string;
  occurredAt: string; // ISO 8601
}

export interface OrderCreatedPayload extends BaseEventPayload {
  total: number; // valor em reais (com 2 decimais)
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PaymentConfirmedPayload extends BaseEventPayload {
  total: number;
  items: Array<{ productId: string; quantity: number }>;
}

export interface PaymentFailedPayload extends BaseEventPayload {
  reason: string;
}

export interface InventoryConfirmedPayload extends BaseEventPayload {
  items: Array<{ productId: string; quantity: number }>;
}

export interface InventoryCancelledPayload extends BaseEventPayload {
  reason: string;
  insufficientItems?: Array<{ productId: string; requested: number; available: number }>;
}
