import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@domain/enums.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/domain-error.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaCustomerRepository } from '@infrastructure/repositories/prisma-customer-repository.js';

const idParamSchema = z.object({ id: z.string().uuid() });

/**
 * Rotas de leitura de clientes. O cadastro foi feito em /auth/register.
 * - GET /customers/me        — qualquer usuário autenticado
 * - GET /customers/:id       — admin ou o próprio cliente
 * - GET /customers           — apenas admin
 */
export async function customersRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const customers = new PrismaCustomerRepository(prisma);

  app.get(
    '/customers/me',
    {
      preHandler: app.authorize(),
      schema: { tags: ['customers'], summary: 'Dados do cliente autenticado', security: [{ bearerAuth: [] }] },
    },
    async (req) => {
      const customer = await customers.findById(req.user.sub);
      if (!customer) throw new NotFoundError('Cliente', req.user.sub);
      return serialize(customer);
    },
  );

  app.get(
    '/customers/:id',
    {
      preHandler: app.authorize(),
      schema: { tags: ['customers'], summary: 'Buscar cliente por id', security: [{ bearerAuth: [] }] },
    },
    async (req) => {
      const { id } = idParamSchema.parse(req.params);
      if (req.user.role !== Role.ADMIN && req.user.sub !== id) {
        throw new ForbiddenError();
      }
      const customer = await customers.findById(id);
      if (!customer) throw new NotFoundError('Cliente', id);
      return serialize(customer);
    },
  );

  app.get(
    '/customers',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: { tags: ['customers'], summary: 'Listar clientes (admin)', security: [{ bearerAuth: [] }] },
    },
    async () => {
      const list = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
      return list.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        document: c.document,
        role: c.role,
        createdAt: c.createdAt.toISOString(),
      }));
    },
  );
}

function serialize(c: import('@domain/entities/customer.js').Customer) {
  return {
    id: c.id,
    name: c.name,
    email: c.email.value,
    document: c.document.value,
    documentKind: c.document.kind,
    role: c.role,
    createdAt: c.createdAt.toISOString(),
  };
}
