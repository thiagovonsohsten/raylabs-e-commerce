import type { ProductRepository } from '@application/ports/product-repository.js';

export class ListProductsUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute() {
    const items = await this.products.findMany();
    return items.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price.toAmount(),
      stock: product.stock,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));
  }
}
