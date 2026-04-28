import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderStatus, Role } from '@prisma/client';
import {
  INVENTORY_CONSUMER_NAME,
  makeInventoryHandler,
} from '@interfaces/consumers/inventory-consumer.js';
import { PrismaIdempotencyStore } from '@infrastructure/repositories/prisma-idempotency-store.js';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';
import { resetDatabase, testPrisma } from './setup.js';

/**
 * Testes do consumer de estoque com:
 *  - Publisher mockado (verificamos quais eventos são publicados).
 *  - Idempotência real (banco de dados).
 *  - Lock pessimista real.
 */
describe('Integration — Inventory consumer flow', () => {
  let customerId: string;
  let productId: string;
  let orderId: string;
  let publisher: { publish: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    await resetDatabase();

    const customer = await testPrisma.customer.create({
      data: {
        name: 'Test',
        email: 'inv@x.com',
        document: '52998224725',
        passwordHash: 'h',
        role: Role.CUSTOMER,
      },
    });
    customerId = customer.id;

    const product = await testPrisma.product.create({
      data: { name: 'Produto', priceCents: 5000n, stock: 3 },
    });
    productId = product.id;

    const order = await testPrisma.order.create({
      data: {
        customerId,
        totalCents: 5000n,
        items: {
          create: [
            { productId, productName: 'Produto', unitPriceCents: 5000n, quantity: 1 },
          ],
        },
      },
    });
    orderId = order.id;

    publisher = { publish: vi.fn().mockResolvedValue(undefined) };
  });

  it('estoque suficiente: debita, marca CONFIRMED e publica inventory.confirmed', async () => {
    const handler = makeInventoryHandler({
      prisma: testPrisma,
      products: new PrismaProductRepository(testPrisma),
      publisher: publisher as unknown as import('@infrastructure/messaging/rabbitmq-publisher.js').RabbitMqPublisher,
      idempotency: new PrismaIdempotencyStore(testPrisma),
    });

    await handler(
      {
        orderId,
        customerId,
        occurredAt: new Date().toISOString(),
        total: 50,
        items: [{ productId, quantity: 1 }],
      },
      { messageId: 'msg-1', routingKey: 'payment.confirmed', attempts: 0 },
    );

    const order = await testPrisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe(OrderStatus.CONFIRMED);

    const product = await testPrisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(2);

    expect(publisher.publish).toHaveBeenCalledWith(
      'inventory.confirmed',
      expect.objectContaining({ orderId }),
      expect.any(String),
    );
  });

  it('estoque insuficiente: marca CANCELLED e publica inventory.cancelled', async () => {
    const handler = makeInventoryHandler({
      prisma: testPrisma,
      products: new PrismaProductRepository(testPrisma),
      publisher: publisher as unknown as import('@infrastructure/messaging/rabbitmq-publisher.js').RabbitMqPublisher,
      idempotency: new PrismaIdempotencyStore(testPrisma),
    });

    await handler(
      {
        orderId,
        customerId,
        occurredAt: new Date().toISOString(),
        total: 5000,
        items: [{ productId, quantity: 999 }],
      },
      { messageId: 'msg-2', routingKey: 'payment.confirmed', attempts: 0 },
    );

    const order = await testPrisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe(OrderStatus.CANCELLED);

    const product = await testPrisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(3); // não decrementou

    expect(publisher.publish).toHaveBeenCalledWith(
      'inventory.cancelled',
      expect.objectContaining({ orderId, reason: expect.any(String) }),
      expect.any(String),
    );
  });

  it('idempotência: mesma mensagem processada 2x não duplica efeito', async () => {
    const handler = makeInventoryHandler({
      prisma: testPrisma,
      products: new PrismaProductRepository(testPrisma),
      publisher: publisher as unknown as import('@infrastructure/messaging/rabbitmq-publisher.js').RabbitMqPublisher,
      idempotency: new PrismaIdempotencyStore(testPrisma),
    });

    const ctx = { messageId: 'duplicated', routingKey: 'payment.confirmed', attempts: 0 };
    const payload = {
      orderId,
      customerId,
      occurredAt: new Date().toISOString(),
      total: 50,
      items: [{ productId, quantity: 1 }],
    };

    await handler(payload, ctx);
    await handler(payload, ctx); // duplicada

    const product = await testPrisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(2); // debitou apenas 1x

    const processed = await testPrisma.processedEvent.findMany({
      where: { messageId: 'duplicated', consumer: INVENTORY_CONSUMER_NAME },
    });
    expect(processed).toHaveLength(1);
  });
});
