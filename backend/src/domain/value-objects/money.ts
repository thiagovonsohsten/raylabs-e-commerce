import { ValidationError } from '@shared/errors/domain-error.js';

/**
 * Money em centavos para evitar erros de ponto flutuante.
 * Aritmética interna usa BigInt; superfície externa expõe number quando seguro.
 */
export class Money {
  private constructor(public readonly cents: bigint) {}

  static fromCents(cents: number | bigint): Money {
    const value = typeof cents === 'bigint' ? cents : BigInt(Math.round(cents));
    if (value < 0n) {
      throw new ValidationError('Valor monetário não pode ser negativo.');
    }
    return new Money(value);
  }

  // Aceita número em reais (ex.: 19.99). Converte para centavos arredondando half-up.
  static fromAmount(amount: number | string): Money {
    const num = typeof amount === 'string' ? Number(amount) : amount;
    if (!Number.isFinite(num)) {
      throw new ValidationError(`Valor monetário inválido: "${amount}".`);
    }
    if (num < 0) {
      throw new ValidationError('Valor monetário não pode ser negativo.');
    }
    return new Money(BigInt(Math.round(num * 100)));
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  multiply(qty: number): Money {
    if (!Number.isInteger(qty) || qty < 0) {
      throw new ValidationError('Quantidade deve ser inteiro não-negativo.');
    }
    return new Money(this.cents * BigInt(qty));
  }

  // Retorna como número em reais (com 2 decimais)
  toAmount(): number {
    return Number(this.cents) / 100;
  }

  toString(): string {
    return this.toAmount().toFixed(2);
  }
}
