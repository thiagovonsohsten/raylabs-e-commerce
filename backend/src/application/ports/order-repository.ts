import { Order } from '@domain/entities/order.js';
import { OrderStatus } from '@domain/enums.js';

/**
 * Porta do repositório de pedidos.
 *
 * createWithOutbox executa em transação atômica:
 *   1) cria Order + OrderItems
 *   2) cria OutboxEvent (status PENDING) com o payload do evento order.created
 *
 * Isso garante que evento e estado nunca divergem (outbox pattern).
 */
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findManyByCustomer(customerId: string): Promise<Order[]>;
  findAll(): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;

  createWithOutbox(input: {
    customerId: string;
    items: Array<{ productId: string; productName: string; unitPriceCents: bigint; quantity: number }>;
    eventType: string;
    eventBuilder: (orderId: string, totalCents: bigint) => Record<string, unknown>;
  }): Promise<Order>;
}
