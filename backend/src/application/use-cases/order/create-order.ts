import { EventTypes, type OrderCreatedPayload } from '@domain/events/index.js';
import { Money } from '@domain/value-objects/money.js';
import { NotFoundError, ValidationError } from '@shared/errors/domain-error.js';
import type { OrderRepository } from '@application/ports/order-repository.js';
import type { ProductRepository } from '@application/ports/product-repository.js';

export interface CreateOrderInput {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateOrderOutput {
  orderId: string;
  status: string;
  total: number;
}

/**
 * Use-case de criação de pedido.
 *
 * Importante: NÃO debita estoque aqui. O débito acontece de forma assíncrona
 * no inventory-consumer (após pagamento confirmado). Aqui apenas:
 *   1. Valida produtos existem.
 *   2. Cria Order + OrderItems + OutboxEvent em uma transação.
 *
 * O estoque pode acabar entre criação e processamento — esse caso é tratado
 * pelo inventory-consumer cancelando o pedido.
 */
export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Pedido precisa ter pelo menos 1 item.');
    }
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationError(`Quantidade inválida para produto ${item.productId}.`);
      }
    }

    // Resolve cada produto para obter nome e preço atual (snapshot no pedido)
    const enriched = await Promise.all(
      input.items.map(async (item) => {
        const product = await this.products.findById(item.productId);
        if (!product) throw new NotFoundError('Produto', item.productId);
        return {
          productId: product.id,
          productName: product.name,
          unitPriceCents: product.price.cents,
          quantity: item.quantity,
        };
      }),
    );

    const order = await this.orders.createWithOutbox({
      customerId: input.customerId,
      items: enriched,
      eventType: EventTypes.ORDER_CREATED,
      eventBuilder: (orderId, totalCents) => {
        const payload: OrderCreatedPayload = {
          orderId,
          customerId: input.customerId,
          occurredAt: new Date().toISOString(),
          total: Money.fromCents(totalCents).toAmount(),
          items: enriched.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: Money.fromCents(i.unitPriceCents).toAmount(),
          })),
        };
        return payload as unknown as Record<string, unknown>;
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      total: order.total.toAmount(),
    };
  }
}
