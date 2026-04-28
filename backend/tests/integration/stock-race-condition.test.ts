import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';
import { resetDatabase, testPrisma } from './setup.js';

/**
 * Teste crítico: 10 chamadas simultâneas de debitStockBatch competindo
 * por um produto com estoque 5 devem resultar em exatamente 5 sucessos
 * e 5 falhas — graças ao SELECT FOR UPDATE em transação.
 *
 * Sem o lock pessimista, várias transações leriam stock=5 ao mesmo tempo
 * e tentariam decrementar — gerando estoque negativo (race condition clássica).
 */
describe('Integration — Stock race condition (pessimistic lock)', () => {
  let productId: string;

  beforeEach(async () => {
    await resetDatabase();
    const product = await testPrisma.product.create({
      data: { name: 'Edição Limitada', priceCents: 5000n, stock: 5 },
    });
    productId = product.id;
  });

  it('10 débitos concorrentes de 1 unidade num produto com estoque 5 → 5 ok, 5 insuficiente, estoque final = 0', async () => {
    const repo = new PrismaProductRepository(testPrisma);

    const operations = Array.from({ length: 10 }, () =>
      repo.debitStockBatch([{ productId, quantity: 1 }]),
    );
    const results = await Promise.all(operations);

    const success = results.filter((r) => r.ok).length;
    const failure = results.filter((r) => !r.ok).length;

    expect(success).toBe(5);
    expect(failure).toBe(5);

    const final = await testPrisma.product.findUnique({ where: { id: productId } });
    expect(final?.stock).toBe(0);
  });

  it('débito acima do disponível retorna insufficient e não modifica estoque', async () => {
    const repo = new PrismaProductRepository(testPrisma);
    const result = await repo.debitStockBatch([{ productId, quantity: 6 }]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.insufficient).toEqual([
        { productId, requested: 6, available: 5 },
      ]);
    }

    const product = await testPrisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(5);
  });

  it('débito de batch múltiplo é atômico: se 1 falha, nenhum produto é decrementado', async () => {
    const second = await testPrisma.product.create({
      data: { name: 'Outro', priceCents: 1000n, stock: 10 },
    });

    const repo = new PrismaProductRepository(testPrisma);
    const result = await repo.debitStockBatch([
      { productId, quantity: 6 }, // estoque 5, vai falhar
      { productId: second.id, quantity: 2 }, // estoque 10, daria
    ]);

    expect(result.ok).toBe(false);

    const p1 = await testPrisma.product.findUnique({ where: { id: productId } });
    const p2 = await testPrisma.product.findUnique({ where: { id: second.id } });
    expect(p1?.stock).toBe(5);
    expect(p2?.stock).toBe(10);
  });
});
