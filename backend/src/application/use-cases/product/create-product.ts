import { Money } from '@domain/value-objects/money.js';
import { ValidationError } from '@shared/errors/domain-error.js';
import type { ProductRepository } from '@application/ports/product-repository.js';

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
}

export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: CreateProductInput) {
    if (input.stock < 0 || !Number.isInteger(input.stock)) {
      throw new ValidationError('Estoque deve ser inteiro não-negativo.');
    }
    const price = Money.fromAmount(input.price);
    const created = await this.products.create({
      name: input.name.trim(),
      priceCents: price.cents,
      stock: input.stock,
    });
    return {
      id: created.id,
      name: created.name,
      price: created.price.toAmount(),
      stock: created.stock,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
