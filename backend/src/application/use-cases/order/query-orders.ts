import { Role } from '@domain/enums.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/domain-error.js';
import type { OrderRepository } from '@application/ports/order-repository.js';

/**
 * Casos de uso de leitura de pedidos. Aplica regras de autorização:
 *   - CUSTOMER só vê pedidos próprios.
 *   - ADMIN vê tudo.
 */
export class QueryOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async getById(orderId: string, requester: { sub: string; role: Role }) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Pedido', orderId);
    if (requester.role !== Role.ADMIN && order.customerId !== requester.sub) {
      throw new ForbiddenError();
    }
    return this.serialize(order);
  }

  async listForRequester(requester: { sub: string; role: Role }, customerIdFilter?: string) {
    if (requester.role === Role.ADMIN) {
      const list = customerIdFilter
        ? await this.orders.findManyByCustomer(customerIdFilter)
        : await this.orders.findAll();
      return list.map((o) => this.serialize(o));
    }
    // Customer: força próprio id
    const list = await this.orders.findManyByCustomer(requester.sub);
    return list.map((o) => this.serialize(o));
  }

  private serialize(order: import('@domain/entities/order.js').Order) {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      total: order.total.toAmount(),
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        unitPrice: i.unitPrice.toAmount(),
        quantity: i.quantity,
        subtotal: i.subtotal().toAmount(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
