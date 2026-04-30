import { Money } from '@domain/value-objects/money.js';
import { ValidationError } from '@shared/errors/domain-error.js';
import type { ProductRepository } from '@application/ports/product-repository.js';

export interface UpdateProductInput {
  name?: string;
  price?: number;
  stock?: number;
}

export class UpdateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string, input: UpdateProductInput) {
    const data: { name?: string; priceCents?: bigint; stock?: number } = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.price !== undefined) data.priceCents = Money.fromAmount(input.price).cents;
    if (input.stock !== undefined) {
      if (input.stock < 0 || !Number.isInteger(input.stock)) {
        throw new ValidationError('Estoque deve ser inteiro não-negativo.');
      }
      data.stock = input.stock;
    }
    const updated = await this.products.update(id, data);
    return {
      id: updated.id,
      name: updated.name,
      price: updated.price.toAmount(),
      stock: updated.stock,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
