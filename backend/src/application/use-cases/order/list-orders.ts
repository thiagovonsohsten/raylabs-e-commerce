import { Role } from '@domain/enums.js';
import type { OrderRepository } from '@application/ports/order-repository.js';

export interface OrderRequester {
  sub: string;
  role: Role;
}

export class ListOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(requester: OrderRequester, customerIdFilter?: string) {
    if (requester.role === Role.ADMIN) {
      const list = customerIdFilter
        ? await this.orders.findManyByCustomer(customerIdFilter)
        : await this.orders.findAll();
      return list.map((o) => this.serialize(o));
    }
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
