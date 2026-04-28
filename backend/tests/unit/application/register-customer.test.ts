import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Customer } from '@domain/entities/customer.js';
import { Role } from '@domain/enums.js';
import { Document } from '@domain/value-objects/document.js';
import { Email } from '@domain/value-objects/email.js';
import { ConflictError } from '@shared/errors/domain-error.js';
import { RegisterCustomerUseCase } from '@application/use-cases/auth/register-customer.js';
import type { CustomerRepository } from '@application/ports/customer-repository.js';
import type { HashService } from '@application/ports/hash-service.js';

function makeRepo(): CustomerRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByDocument: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
  };
}

function makeHasher(): HashService {
  return {
    hash: vi.fn().mockResolvedValue('HASHED'),
    compare: vi.fn(),
  };
}

describe('RegisterCustomerUseCase', () => {
  let repo: CustomerRepository;
  let hasher: HashService;
  let useCase: RegisterCustomerUseCase;

  beforeEach(() => {
    repo = makeRepo();
    hasher = makeHasher();
    useCase = new RegisterCustomerUseCase(repo, hasher);

    (repo.create as ReturnType<typeof vi.fn>).mockImplementation(async (data) => {
      return new Customer({
        id: 'new-id',
        name: data.name,
        email: Email.create(data.email),
        document: Document.create(data.document),
        passwordHash: data.passwordHash,
        role: data.role,
        createdAt: new Date(),
      });
    });
  });

  it('cria um cliente com role CUSTOMER por padrão', async () => {
    const out = await useCase.execute({
      name: 'João',
      email: 'joao@example.com',
      document: '52998224725',
      password: 'senha123',
    });
    expect(out.role).toBe(Role.CUSTOMER);
    expect(hasher.hash).toHaveBeenCalledWith('senha123');
    expect(repo.create).toHaveBeenCalled();
  });

  it('falha quando e-mail já existe', async () => {
    (repo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Customer({
        id: 'x',
        name: 'X',
        email: Email.create('joao@example.com'),
        document: Document.create('52998224725'),
        passwordHash: 'h',
        role: Role.CUSTOMER,
        createdAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({
        name: 'João',
        email: 'joao@example.com',
        document: '11144477735',
        password: 'senha123',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('falha quando documento já existe', async () => {
    (repo.findByDocument as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Customer({
        id: 'x',
        name: 'X',
        email: Email.create('outro@example.com'),
        document: Document.create('52998224725'),
        passwordHash: 'h',
        role: Role.CUSTOMER,
        createdAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({
        name: 'João',
        email: 'novo@example.com',
        document: '52998224725',
        password: 'senha123',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
