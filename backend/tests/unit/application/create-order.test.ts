import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Order } from '@domain/entities/order.js';
import { OrderItem } from '@domain/entities/order-item.js';
import { OrderStatus } from '@domain/enums.js';
import { Product } from '@domain/entities/product.js';
import { Money } from '@domain/value-objects/money.js';
import { NotFoundError, ValidationError } from '@shared/errors/domain-error.js';
import { CreateOrderUseCase } from '@application/use-cases/order/create-order.js';
import type { OrderRepository } from '@application/ports/order-repository.js';
import type { ProductRepository } from '@application/ports/product-repository.js';

function makeProduct(id: string, price: number, stock: number): Product {
  return new Product({
    id,
    name: `Produto ${id}`,
    price: Money.fromAmount(price),
    stock,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateOrderUseCase', () => {
  let orders: OrderRepository;
  let products: ProductRepository;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    orders = {
      findById: vi.fn(),
      findManyByCustomer: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
      createWithOutbox: vi.fn(async (input) => {
        const items = input.items.map(
          (i) =>
            new OrderItem({
              productId: i.productId,
              productName: i.productName,
              unitPrice: Money.fromCents(i.unitPriceCents),
              quantity: i.quantity,
            }),
        );
        return new Order({
          id: 'order-1',
          customerId: input.customerId,
          status: OrderStatus.PENDING_PAYMENT,
          items,
          total: Order.calculateTotal(items),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
    };

    products = {
      findById: vi.fn(async (id) => makeProduct(id, 10, 5)),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      debitStockBatch: vi.fn(),
    };

    useCase = new CreateOrderUseCase(orders, products);
  });

  it('cria pedido em status PENDING_PAYMENT e dispara outbox', async () => {
    const out = await useCase.execute({
      customerId: 'cust-1',
      items: [{ productId: 'p1', quantity: 2 }],
    });
    expect(out.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(out.total).toBe(20);
    expect(orders.createWithOutbox).toHaveBeenCalledOnce();
  });

  it('passa eventBuilder com payload válido para o repositório', async () => {
    await useCase.execute({
      customerId: 'cust-1',
      items: [{ productId: 'p1', quantity: 3 }],
    });
    const callArg = (orders.createWithOutbox as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.eventType).toBe('order.created');
    const payload = callArg.eventBuilder('test-id', 3000n);
    expect(payload).toMatchObject({
      orderId: 'test-id',
      customerId: 'cust-1',
      total: 30,
    });
  });

  it('falha se produto não existe', async () => {
    (products.findById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(
      useCase.execute({
        customerId: 'cust-1',
        items: [{ productId: 'inexistente', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('falha se quantidade for zero ou negativa', async () => {
    await expect(
      useCase.execute({
        customerId: 'cust-1',
        items: [{ productId: 'p1', quantity: 0 }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('falha se não há itens', async () => {
    await expect(
      useCase.execute({ customerId: 'cust-1', items: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
