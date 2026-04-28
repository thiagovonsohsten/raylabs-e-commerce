import { ValidationError } from '@shared/errors/domain-error.js';
import { Money } from '../value-objects/money.js';

/**
 * Item de pedido (sem identidade externa — sempre filho de um Order).
 * Imutável após criação para preservar o preço histórico.
 */
export interface OrderItemProps {
  id?: string;
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: number;
}

export class OrderItem {
  constructor(private readonly props: OrderItemProps) {
    if (!Number.isInteger(props.quantity) || props.quantity <= 0) {
      throw new ValidationError('Quantidade do item deve ser inteiro positivo.');
    }
  }

  get id(): string | undefined {
    return this.props.id;
  }
  get productId(): string {
    return this.props.productId;
  }
  get productName(): string {
    return this.props.productName;
  }
  get unitPrice(): Money {
    return this.props.unitPrice;
  }
  get quantity(): number {
    return this.props.quantity;
  }

  subtotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }
}
