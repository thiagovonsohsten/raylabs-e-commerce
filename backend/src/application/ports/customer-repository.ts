import { Customer } from '@domain/entities/customer.js';

/**
 * Porta (interface) do repositório de clientes.
 * A implementação concreta vive em infrastructure/repositories.
 */
export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByDocument(document: string): Promise<Customer | null>;
  create(data: {
    name: string;
    email: string;
    document: string;
    passwordHash: string;
    role: 'ADMIN' | 'CUSTOMER';
  }): Promise<Customer>;
}
