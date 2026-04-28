import { describe, expect, it } from 'vitest';
import { Money } from '@domain/value-objects/money.js';
import { ValidationError } from '@shared/errors/domain-error.js';

describe('Money VO', () => {
  it('cria a partir de valor em reais sem perda de precisão', () => {
    const m = Money.fromAmount(19.99);
    expect(m.cents).toBe(1999n);
    expect(m.toAmount()).toBe(19.99);
  });

  it('soma sem erros de ponto flutuante', () => {
    const total = Money.fromAmount(0.1).add(Money.fromAmount(0.2));
    expect(total.toAmount()).toBe(0.3);
  });

  it('multiplica por inteiro', () => {
    const total = Money.fromAmount(7.5).multiply(4);
    expect(total.toAmount()).toBe(30);
  });

  it('rejeita valor negativo', () => {
    expect(() => Money.fromAmount(-1)).toThrow(ValidationError);
  });

  it('rejeita multiplicação por não-inteiro', () => {
    expect(() => Money.fromAmount(10).multiply(1.5)).toThrow(ValidationError);
  });
});
