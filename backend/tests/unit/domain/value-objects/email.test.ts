import { describe, expect, it } from 'vitest';
import { Email } from '@domain/value-objects/email.js';
import { ValidationError } from '@shared/errors/domain-error.js';

describe('Email VO', () => {
  it('aceita e-mail válido e normaliza para lowercase', () => {
    const email = Email.create('  John.Doe@Example.com ');
    expect(email.value).toBe('john.doe@example.com');
  });

  it('rejeita e-mail sem @', () => {
    expect(() => Email.create('foo')).toThrow(ValidationError);
  });

  it('rejeita string vazia', () => {
    expect(() => Email.create('')).toThrow(ValidationError);
  });

  it('rejeita e-mail sem domínio', () => {
    expect(() => Email.create('foo@')).toThrow(ValidationError);
  });
});
