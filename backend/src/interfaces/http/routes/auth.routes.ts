import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LoginUseCase } from '@application/use-cases/auth/login.js';
import { RegisterCustomerUseCase } from '@application/use-cases/auth/register-customer.js';
import { BcryptHashService } from '@infrastructure/auth/bcrypt-hash-service.js';
import { FastifyJwtTokenService } from '@infrastructure/auth/jwt-token-service.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaCustomerRepository } from '@infrastructure/repositories/prisma-customer-repository.js';

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  document: z.string().min(11).max(20),
  password: z.string().min(6).max(72),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const customers = new PrismaCustomerRepository(prisma);
  const hasher = new BcryptHashService();
  const tokens = new FastifyJwtTokenService(app);

  const registerUseCase = new RegisterCustomerUseCase(customers, hasher);
  const loginUseCase = new LoginUseCase(customers, hasher, tokens);

  app.post(
    '/auth/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Registrar novo cliente',
        body: {
          type: 'object',
          required: ['name', 'email', 'document', 'password'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 120 },
            email: { type: 'string', format: 'email' },
            document: { type: 'string', description: 'CPF ou CNPJ' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      const data = registerSchema.parse(req.body);
      const result = await registerUseCase.execute(data);
      return reply.status(201).send(result);
    },
  );

  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login com e-mail e senha',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const data = loginSchema.parse(req.body);
      const result = await loginUseCase.execute(data);
      return reply.send(result);
    },
  );
}
