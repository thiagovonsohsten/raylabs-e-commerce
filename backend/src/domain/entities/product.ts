import { ValidationError } from '@shared/errors/domain-error.js';
import { Money } from '../value-objects/money.js';

/**
 * Entidade Product.
 * Estoque é sempre não-negativo. Débito de estoque ocorre via repositório com lock pessimista
 * em transação — esta entidade apenas valida invariantes locais.
 */
export interface ProductProps {
  id: string;
  name: string;
  price: Money;
  stock: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  constructor(private readonly props: ProductProps) {
    if (!Number.isInteger(props.stock) || props.stock < 0) {
      throw new ValidationError('Estoque deve ser inteiro não-negativo.');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError('Nome do produto não pode ser vazio.');
    }
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get price(): Money {
    return this.props.price;
  }
  get stock(): number {
    return this.props.stock;
  }
  get version(): number {
    return this.props.version;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasEnoughStock(quantity: number): boolean {
    return this.props.stock >= quantity;
  }
}
