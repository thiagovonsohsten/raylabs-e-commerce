import { beforeEach, describe, expect, it } from 'vitest';
import { OrderStatus, OutboxEventStatus, Role } from '@prisma/client';
import { CreateOrderUseCase } from '@application/use-cases/order/create-order.js';
import { PrismaOrderRepository } from '@infrastructure/repositories/prisma-order-repository.js';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';
import { resetDatabase, testPrisma } from './setup.js';

/**
 * Garante que createOrder cria Order + OrderItems + OutboxEvent
 * em uma única transação (outbox pattern).
 */
describe('Integration — Create Order + Outbox', () => {
  let useCase: CreateOrderUseCase;
  let customerId: string;
  let productId: string;

  beforeEach(async () => {
    await resetDatabase();

    const customer = await testPrisma.customer.create({
      data: {
        name: 'Test',
        email: 'test@x.com',
        document: '52998224725',
        passwordHash: 'h',
        role: Role.CUSTOMER,
      },
    });
    customerId = customer.id;

    const product = await testPrisma.product.create({
      data: { name: 'Item Teste', priceCents: 1000n, stock: 100 },
    });
    productId = product.id;

    useCase = new CreateOrderUseCase(
      new PrismaOrderRepository(testPrisma),
      new PrismaProductRepository(testPrisma),
    );
  });

  it('cria Order, OrderItems e OutboxEvent na mesma transação', async () => {
    const out = await useCase.execute({
      customerId,
      items: [{ productId, quantity: 3 }],
    });

    expect(out.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(out.total).toBe(30);

    const order = await testPrisma.order.findUnique({
      where: { id: out.orderId },
      include: { items: true },
    });
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0]?.quantity).toBe(3);

    const events = await testPrisma.outboxEvent.findMany({
      where: { aggregateId: out.orderId },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('order.created');
    expect(events[0]!.status).toBe(OutboxEventStatus.PENDING);

    const payload = events[0]!.payload as Record<string, unknown>;
    expect(payload.orderId).toBe(out.orderId);
    expect(payload.total).toBe(30);
  });

  it('NÃO debita estoque na criação do pedido (débito ocorre no inventory consumer)', async () => {
    await useCase.execute({
      customerId,
      items: [{ productId, quantity: 5 }],
    });
    const product = await testPrisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(100);
  });
});
