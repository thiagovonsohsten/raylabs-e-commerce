import { Role } from '@domain/enums.js';
import { Document } from '@domain/value-objects/document.js';
import { Email } from '@domain/value-objects/email.js';
import { ConflictError } from '@shared/errors/domain-error.js';
import type { CustomerRepository } from '@application/ports/customer-repository.js';
import type { HashService } from '@application/ports/hash-service.js';

export interface RegisterCustomerInput {
  name: string;
  email: string;
  document: string;
  password: string;
  role?: Role; // opcional: default CUSTOMER. Apenas admin autenticado pode passar ADMIN.
}

export interface RegisterCustomerOutput {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Use-case de registro de cliente.
 * Valida e-mail/documento, garante unicidade e hashea a senha antes de persistir.
 */
export class RegisterCustomerUseCase {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly hasher: HashService,
  ) {}

  async execute(input: RegisterCustomerInput): Promise<RegisterCustomerOutput> {
    const email = Email.create(input.email);
    const document = Document.create(input.document);

    if (await this.customers.findByEmail(email.value)) {
      throw new ConflictError(`Já existe cliente com e-mail "${email.value}".`);
    }
    if (await this.customers.findByDocument(document.value)) {
      throw new ConflictError(`Já existe cliente com este documento.`);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const created = await this.customers.create({
      name: input.name.trim(),
      email: email.value,
      document: document.value,
      passwordHash,
      role: input.role ?? Role.CUSTOMER,
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email.value,
      role: created.role,
    };
  }
}
