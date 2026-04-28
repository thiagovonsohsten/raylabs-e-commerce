import { ValidationError } from '@shared/errors/domain-error.js';
import { OrderStatus } from '../enums.js';
import { Money } from '../value-objects/money.js';
import { OrderItem } from './order-item.js';

/**
 * Entidade Order — agregado raiz do contexto de pedidos.
 *
 * Regras de transição (state machine):
 *   PENDING_PAYMENT → CONFIRMED       (via inventory consumer)
 *   PENDING_PAYMENT → CANCELLED       (via inventory consumer, estoque insuficiente)
 *   PENDING_PAYMENT → PAYMENT_FAILED  (via payment consumer)
 *   Estados finais (CONFIRMED, CANCELLED, PAYMENT_FAILED) são terminais.
 */
export interface OrderProps {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: Money;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  constructor(private props: OrderProps) {
    if (props.items.length === 0) {
      throw new ValidationError('Pedido precisa ter pelo menos 1 item.');
    }
  }

  get id(): string {
    return this.props.id;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get items(): readonly OrderItem[] {
    return this.props.items;
  }
  get total(): Money {
    return this.props.total;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Calcula o total a partir dos itens. Útil na criação de um Order novo.
   */
  static calculateTotal(items: OrderItem[]): Money {
    return items.reduce((acc, item) => acc.add(item.subtotal()), Money.fromCents(0));
  }

  // Transições de estado — todas valida o estado atual antes de mudar.
  confirm(): void {
    this.assertTransition(OrderStatus.CONFIRMED);
    this.props.status = OrderStatus.CONFIRMED;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.assertTransition(OrderStatus.CANCELLED);
    this.props.status = OrderStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  failPayment(): void {
    this.assertTransition(OrderStatus.PAYMENT_FAILED);
    this.props.status = OrderStatus.PAYMENT_FAILED;
    this.props.updatedAt = new Date();
  }

  isFinal(): boolean {
    return this.props.status !== OrderStatus.PENDING_PAYMENT;
  }

  // Regra: só sai de PENDING_PAYMENT. Estados finais não podem mudar.
  private assertTransition(target: OrderStatus): void {
    if (this.props.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ValidationError(
        `Transição inválida: pedido em "${this.props.status}" não pode ir para "${target}".`,
      );
    }
  }
}
