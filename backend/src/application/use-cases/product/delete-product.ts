import type { ProductRepository } from '@application/ports/product-repository.js';

export class DeleteProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(id: string): Promise<void> {
    await this.products.delete(id);
  }
}
