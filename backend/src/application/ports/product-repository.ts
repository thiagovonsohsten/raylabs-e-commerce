import { Product } from '@domain/entities/product.js';

/**
 * Porta do repositório de produtos.
 * O método debitStockBatch executa em uma transação com SELECT FOR UPDATE
 * para evitar race conditions (lock pessimista).
 */
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findMany(): Promise<Product[]>;
  create(data: { name: string; priceCents: bigint; stock: number }): Promise<Product>;
  update(
    id: string,
    data: { name?: string; priceCents?: bigint; stock?: number },
  ): Promise<Product>;
  delete(id: string): Promise<void>;

  /**
   * Tenta debitar estoque atomicamente.
   * Sucesso: retorna { ok: true }.
   * Falha: retorna { ok: false, insufficient: [{ productId, requested, available }] }.
   * Implementação usa SELECT ... FOR UPDATE em uma transação.
   */
  debitStockBatch(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<DebitStockResult>;
}

export type DebitStockResult =
  | { ok: true }
  | {
      ok: false;
      insufficient: Array<{ productId: string; requested: number; available: number }>;
    };
