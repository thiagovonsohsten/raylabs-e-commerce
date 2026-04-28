import { describe, expect, it } from 'vitest';
import { Document } from '@domain/value-objects/document.js';
import { ValidationError } from '@shared/errors/domain-error.js';

describe('Document VO', () => {
  it('aceita CPF válido com máscara', () => {
    const doc = Document.create('111.444.777-35');
    expect(doc.kind).toBe('CPF');
    expect(doc.value).toBe('11144477735');
  });

  it('aceita CNPJ válido com máscara', () => {
    const doc = Document.create('11.222.333/0001-81');
    expect(doc.kind).toBe('CNPJ');
    expect(doc.value).toBe('11222333000181');
  });

  it('rejeita CPF com dígitos repetidos', () => {
    expect(() => Document.create('11111111111')).toThrow(ValidationError);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(() => Document.create('11144477700')).toThrow(ValidationError);
  });

  it('rejeita string com tamanho diferente de 11 ou 14', () => {
    expect(() => Document.create('123')).toThrow(ValidationError);
  });
});
