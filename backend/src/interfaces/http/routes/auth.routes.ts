import type { FastifyInstance } from 'fastify';
import { LoginUseCase, RegisterCustomerUseCase } from '@application/use-cases/auth/index.js';
import { BcryptHashService } from '@infrastructure/auth/bcrypt-hash-service.js';
import { FastifyJwtTokenService } from '@infrastructure/auth/jwt-token-service.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaCustomerRepository } from '@infrastructure/repositories/prisma-customer-repository.js';
import {
  loginBodySchema,
  loginRouteSchema,
  registerBodySchema,
  registerRouteSchema,
} from '@interfaces/http/schemas/auth.schemas.js';

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
      schema: registerRouteSchema,
    },
    async (req, reply) => {
      const data = registerBodySchema.parse(req.body);
      const result = await registerUseCase.execute(data);
      return reply.status(201).send(result);
    },
  );

  app.post(
    '/auth/login',
    {
      schema: loginRouteSchema,
    },
    async (req, reply) => {
      const data = loginBodySchema.parse(req.body);
      const result = await loginUseCase.execute(data);
      return reply.send(result);
    },
  );
}
