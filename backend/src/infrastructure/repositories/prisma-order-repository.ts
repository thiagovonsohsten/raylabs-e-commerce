import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  OrderStatus as PrismaOrderStatus,
  PrismaClient,
} from '@prisma/client';
import { Order } from '@domain/entities/order.js';
import { OrderItem } from '@domain/entities/order-item.js';
import { OrderStatus } from '@domain/enums.js';
import { Money } from '@domain/value-objects/money.js';
import { NotFoundError } from '@shared/errors/domain-error.js';
import type { OrderRepository } from '@application/ports/order-repository.js';

type OrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

/**
 * Repositório de pedidos.
 *
 * createWithOutbox: dentro de UMA transação atômica:
 *   1) cria Order + OrderItems
 *   2) cria OutboxEvent(PENDING) com payload do evento order.created
 * Garante que evento e estado são salvos juntos (outbox pattern).
 */
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const found = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return found ? this.toDomain(found) : null;
  }

  async findManyByCustomer(customerId: string): Promise<Order[]> {
    const list = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((o) => this.toDomain(o));
  }

  async findAll(): Promise<Order[]> {
    const list = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((o) => this.toDomain(o));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const updated = await this.prisma.order.update({
        where: { id },
        data: { status: status as PrismaOrderStatus },
        include: { items: true },
      });
      return this.toDomain(updated);
    } catch {
      throw new NotFoundError('Pedido', id);
    }
  }

  async createWithOutbox(input: {
    customerId: string;
    items: Array<{
      productId: string;
      productName: string;
      unitPriceCents: bigint;
      quantity: number;
    }>;
    eventType: string;
    eventBuilder: (orderId: string, totalCents: bigint) => Record<string, unknown>;
  }): Promise<Order> {
    const totalCents = input.items.reduce(
      (acc, i) => acc + i.unitPriceCents * BigInt(i.quantity),
      0n,
    );

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: input.customerId,
          totalCents,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              unitPriceCents: i.unitPriceCents,
              quantity: i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      const payload = input.eventBuilder(order.id, totalCents);
      await tx.outboxEvent.create({
        data: {
          aggregateId: order.id,
          type: input.eventType,
          payload: payload as object,
        },
      });

      return this.toDomain(order);
    });
  }

  private toDomain(row: OrderWithItems): Order {
    return new Order({
      id: row.id,
      customerId: row.customerId,
      status: row.status as OrderStatus,
      total: Money.fromCents(row.totalCents),
      items: row.items.map(
        (it) =>
          new OrderItem({
            id: it.id,
            productId: it.productId,
            productName: it.productName,
            unitPrice: Money.fromCents(it.unitPriceCents),
            quantity: it.quantity,
          }),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
