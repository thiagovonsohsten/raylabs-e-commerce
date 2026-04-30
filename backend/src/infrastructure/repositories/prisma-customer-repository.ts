import type { PrismaClient, Customer as PrismaCustomer, Role as PrismaRole } from '@prisma/client';
import { Customer } from '@domain/entities/customer.js';
import { Role } from '@domain/enums.js';
import { Document } from '@domain/value-objects/document.js';
import { Email } from '@domain/value-objects/email.js';
import type { CustomerRepository } from '@application/ports/customer-repository.js';

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Customer | null> {
    const found = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    return found ? this.toDomain(found) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const found = await this.prisma.customer.findFirst({ where: { email, deletedAt: null } });
    return found ? this.toDomain(found) : null;
  }

  async findByDocument(document: string): Promise<Customer | null> {
    const found = await this.prisma.customer.findFirst({ where: { document, deletedAt: null } });
    return found ? this.toDomain(found) : null;
  }

  async create(data: {
    name: string;
    email: string;
    document: string;
    passwordHash: string;
    role: 'ADMIN' | 'CUSTOMER';
  }): Promise<Customer> {
    const created = await this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        document: data.document,
        passwordHash: data.passwordHash,
        role: data.role as PrismaRole,
      },
    });
    return this.toDomain(created);
  }

  private toDomain(row: PrismaCustomer): Customer {
    return new Customer({
      id: row.id,
      name: row.name,
      email: Email.create(row.email),
      document: Document.create(row.document),
      passwordHash: row.passwordHash,
      role: row.role as Role,
      createdAt: row.createdAt,
    });
  }
}
