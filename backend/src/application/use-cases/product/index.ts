import { Money } from '@domain/value-objects/money.js';
import { NotFoundError, ValidationError } from '@shared/errors/domain-error.js';
import type { ProductRepository } from '@application/ports/product-repository.js';

/**
 * Use-cases de produto. Mantemos como classe enxuta com métodos por operação
 * para evitar explosão de arquivos para CRUD simples.
 */
export class ProductUseCases {
  constructor(private readonly products: ProductRepository) {}

  async list() {
    const items = await this.products.findMany();
    return items.map(this.serialize);
  }

  async getById(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Produto', id);
    return this.serialize(product);
  }

  async create(input: { name: string; price: number; stock: number }) {
    if (input.stock < 0 || !Number.isInteger(input.stock)) {
      throw new ValidationError('Estoque deve ser inteiro não-negativo.');
    }
    const price = Money.fromAmount(input.price);
    const created = await this.products.create({
      name: input.name.trim(),
      priceCents: price.cents,
      stock: input.stock,
    });
    return this.serialize(created);
  }

  async update(
    id: string,
    input: { name?: string; price?: number; stock?: number },
  ) {
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
    return this.serialize(updated);
  }

  async delete(id: string) {
    await this.products.delete(id);
  }

  private serialize(product: import('@domain/entities/product.js').Product) {
    return {
      id: product.id,
      name: product.name,
      price: product.price.toAmount(),
      stock: product.stock,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
