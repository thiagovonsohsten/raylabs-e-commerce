import type { PrismaClient, Product as PrismaProduct } from '@prisma/client';
import { Product } from '@domain/entities/product.js';
import { Money } from '@domain/value-objects/money.js';
import { NotFoundError } from '@shared/errors/domain-error.js';
import type {
  DebitStockResult,
  ProductRepository,
} from '@application/ports/product-repository.js';

/**
 * Repositório Prisma com lock pessimista no débito de estoque.
 *
 * debitStockBatch:
 *   - Abre transação Serializable.
 *   - Faz SELECT ... FOR UPDATE em cada produto (ordenado por id para evitar deadlock).
 *   - Verifica se há estoque suficiente para todos.
 *   - Se sim, decrementa atomicamente. Se não, retorna lista de itens insuficientes.
 */
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    const found = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    return found ? this.toDomain(found) : null;
  }

  async findMany(): Promise<Product[]> {
    const list = await this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return list.map((p) => this.toDomain(p));
  }

  async create(data: { name: string; priceCents: bigint; stock: number }): Promise<Product> {
    const created = await this.prisma.product.create({ data });
    return this.toDomain(created);
  }

  async update(
    id: string,
    data: { name?: string; priceCents?: bigint; stock?: number },
  ): Promise<Product> {
    const result = await this.prisma.product.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
    if (result.count === 0) {
      throw new NotFoundError('Produto', id);
    }
    const updated = await this.prisma.product.findUnique({ where: { id } });
    if (!updated || updated.deletedAt) throw new NotFoundError('Produto', id);
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const result = await this.prisma.product.updateMany({
      where: { id, deletedAt: null },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (result.count === 0) {
      throw new NotFoundError('Produto', id);
    }
  }

  /**
   * Débito atômico de estoque com lock pessimista (SELECT ... FOR UPDATE).
   * Ordena por id para evitar deadlock entre transações concorrentes.
   */
  async debitStockBatch(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<DebitStockResult> {
    if (items.length === 0) return { ok: true };

    // Consolida quantidades por produto (caso o pedido tenha o mesmo produto duas vezes)
    const aggregated = new Map<string, number>();
    for (const item of items) {
      aggregated.set(item.productId, (aggregated.get(item.productId) ?? 0) + item.quantity);
    }
    const sortedIds = [...aggregated.keys()].sort();

    return this.prisma.$transaction(async (tx) => {
      // Lock pessimista: trava as linhas em ordem fixa de id.
      // Usar parameterized query para evitar SQL injection.
      const locked = await tx.$queryRawUnsafe<Array<{ id: string; stock: number }>>(
        `SELECT id, stock FROM "products" WHERE "deletedAt" IS NULL AND id IN (${sortedIds
          .map((_, i) => `$${i + 1}::uuid`)
          .join(', ')}) ORDER BY id FOR UPDATE`,
        ...sortedIds,
      );

      const stockById = new Map(locked.map((r) => [r.id, r.stock]));
      const insufficient: Array<{ productId: string; requested: number; available: number }> = [];

      for (const [productId, requested] of aggregated.entries()) {
        const available = stockById.get(productId) ?? 0;
        if (available < requested) {
          insufficient.push({ productId, requested, available });
        }
      }

      if (insufficient.length > 0) {
        return { ok: false, insufficient };
      }

      // Tudo ok: debita.
      for (const [productId, requested] of aggregated.entries()) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: requested }, version: { increment: 1 } },
        });
      }
      return { ok: true };
    });
  }

  private toDomain(row: PrismaProduct): Product {
    return new Product({
      id: row.id,
      name: row.name,
      price: Money.fromCents(row.priceCents),
      stock: row.stock,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
