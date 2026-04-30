import type { FastifyInstance } from 'fastify';
import { Role } from '@domain/enums.js';
import { ForbiddenError, NotFoundError } from '@shared/errors/domain-error.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaCustomerRepository } from '@infrastructure/repositories/prisma-customer-repository.js';
import {
  customerIdParamSchema,
  getCustomerByIdRouteSchema,
  getMeRouteSchema,
  listCustomersRouteSchema,
} from '@interfaces/http/schemas/customers.schemas.js';

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
      schema: getMeRouteSchema,
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
      schema: getCustomerByIdRouteSchema,
    },
    async (req) => {
      const { id } = customerIdParamSchema.parse(req.params);
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
      schema: listCustomersRouteSchema,
    },
    async () => {
      const list = await prisma.customer.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
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
