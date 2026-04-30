import { NotFoundError } from '@shared/errors/domain-error.js';
import type { ProductRepository } from '@application/ports/product-repository.js';

export class GetProductByIdUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundError('Produto', id);
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
