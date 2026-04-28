import { ValidationError } from '@shared/errors/domain-error.js';

/**
 * Value object Document — aceita CPF (11 dígitos) ou CNPJ (14 dígitos).
 * Faz validação completa dos dígitos verificadores.
 * Armazena somente os dígitos (sem máscara).
 */
export type DocumentKind = 'CPF' | 'CNPJ';

export class Document {
  private constructor(
    public readonly value: string,
    public readonly kind: DocumentKind,
  ) {}

  static create(input: string): Document {
    const digits = (input ?? '').replace(/\D/g, '');
    if (digits.length === 11) {
      if (!isValidCpf(digits)) {
        throw new ValidationError(`CPF inválido: "${input}".`);
      }
      return new Document(digits, 'CPF');
    }
    if (digits.length === 14) {
      if (!isValidCnpj(digits)) {
        throw new ValidationError(`CNPJ inválido: "${input}".`);
      }
      return new Document(digits, 'CNPJ');
    }
    throw new ValidationError(
      `Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos. Recebido: "${input}".`,
    );
  }

  toString(): string {
    return this.value;
  }
}

// Validação CPF baseada nos dígitos verificadores
function isValidCpf(cpf: string): boolean {
  if (/^(\d)\1+$/.test(cpf)) return false;
  const digits = cpf.split('').map(Number);
  const calc = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === digits[9] && calc(10) === digits[10];
}

// Validação CNPJ baseada nos dígitos verificadores
function isValidCnpj(cnpj: string): boolean {
  if (/^(\d)\1+$/.test(cnpj)) return false;
  const digits = cnpj.split('').map(Number);
  const calc = (length: number): number => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) sum += digits[i] * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === digits[12] && calc(13) === digits[13];
}
