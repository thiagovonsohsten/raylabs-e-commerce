import { Role } from '@domain/enums.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/domain-error.js';
import type { OrderRepository } from '@application/ports/order-repository.js';

export interface OrderRequester {
  sub: string;
  role: Role;
}

export class GetOrderByIdUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string, requester: OrderRequester) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Pedido', orderId);
    if (requester.role !== Role.ADMIN && order.customerId !== requester.sub) {
      throw new ForbiddenError();
    }
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
