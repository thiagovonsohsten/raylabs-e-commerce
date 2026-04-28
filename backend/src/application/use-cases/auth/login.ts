import { Email } from '@domain/value-objects/email.js';
import { UnauthorizedError } from '@shared/errors/domain-error.js';
import type { CustomerRepository } from '@application/ports/customer-repository.js';
import type { HashService } from '@application/ports/hash-service.js';
import type { TokenService } from '@application/ports/token-service.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  customer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Use-case de autenticação. Sempre retorna a mesma mensagem em caso de falha
 * (não diferencia "e-mail inexistente" de "senha incorreta") por segurança.
 */
export class LoginUseCase {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly hasher: HashService,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = Email.create(input.email);
    const customer = await this.customers.findByEmail(email.value);
    if (!customer) {
      throw new UnauthorizedError();
    }
    const ok = await this.hasher.compare(input.password, customer.passwordHash);
    if (!ok) {
      throw new UnauthorizedError();
    }

    const token = await this.tokens.sign({
      sub: customer.id,
      email: customer.email.value,
      role: customer.role,
    });

    return {
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email.value,
        role: customer.role,
      },
    };
  }
}
