import { ValidationError } from '@shared/errors/domain-error.js';

/**
 * Value object Email — imutável e validado na construção.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(public readonly value: string) {}

  static create(input: string): Email {
    const normalized = input.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new ValidationError(`E-mail inválido: "${input}".`);
    }
    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }
}
