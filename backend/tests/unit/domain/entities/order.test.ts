import { describe, expect, it } from 'vitest';
import { Order } from '@domain/entities/order.js';
import { OrderItem } from '@domain/entities/order-item.js';
import { OrderStatus } from '@domain/enums.js';
import { Money } from '@domain/value-objects/money.js';
import { ValidationError } from '@shared/errors/domain-error.js';

function makeOrder(status: OrderStatus = OrderStatus.PENDING_PAYMENT): Order {
  const items = [
    new OrderItem({
      productId: 'p1',
      productName: 'Item',
      unitPrice: Money.fromAmount(10),
      quantity: 2,
    }),
  ];
  return new Order({
    id: 'o1',
    customerId: 'c1',
    status,
    items,
    total: Order.calculateTotal(items),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('Order — state machine', () => {
  it('PENDING_PAYMENT → CONFIRMED via confirm()', () => {
    const order = makeOrder();
    order.confirm();
    expect(order.status).toBe(OrderStatus.CONFIRMED);
  });

  it('PENDING_PAYMENT → CANCELLED via cancel()', () => {
    const order = makeOrder();
    order.cancel();
    expect(order.status).toBe(OrderStatus.CANCELLED);
  });

  it('PENDING_PAYMENT → PAYMENT_FAILED via failPayment()', () => {
    const order = makeOrder();
    order.failPayment();
    expect(order.status).toBe(OrderStatus.PAYMENT_FAILED);
  });

  it('rejeita transição a partir de estado terminal', () => {
    const order = makeOrder(OrderStatus.CONFIRMED);
    expect(() => order.cancel()).toThrow(ValidationError);
    expect(() => order.confirm()).toThrow(ValidationError);
    expect(() => order.failPayment()).toThrow(ValidationError);
  });

  it('isFinal() reflete corretamente', () => {
    expect(makeOrder().isFinal()).toBe(false);
    expect(makeOrder(OrderStatus.CONFIRMED).isFinal()).toBe(true);
  });

  it('calculateTotal soma todos os subtotais', () => {
    const items = [
      new OrderItem({
        productId: 'a',
        productName: 'A',
        unitPrice: Money.fromAmount(10),
        quantity: 2,
      }),
      new OrderItem({
        productId: 'b',
        productName: 'B',
        unitPrice: Money.fromAmount(5.5),
        quantity: 3,
      }),
    ];
    const total = Order.calculateTotal(items);
    expect(total.toAmount()).toBe(36.5);
  });

  it('rejeita pedido sem itens', () => {
    expect(
      () =>
        new Order({
          id: 'o1',
          customerId: 'c1',
          status: OrderStatus.PENDING_PAYMENT,
          items: [],
          total: Money.fromCents(0),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    ).toThrow(ValidationError);
  });
});
