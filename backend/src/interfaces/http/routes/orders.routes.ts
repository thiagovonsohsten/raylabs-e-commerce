import type { FastifyInstance } from 'fastify';
import { Role } from '@domain/enums.js';
import { CreateOrderUseCase } from '@application/use-cases/order/create-order.js';
import { QueryOrdersUseCase } from '@application/use-cases/order/query-orders.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaOrderRepository } from '@infrastructure/repositories/prisma-order-repository.js';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';
import {
  createOrderBodySchema,
  createOrderRouteSchema,
  getOrderByIdRouteSchema,
  listOrdersRouteSchema,
  orderIdParamSchema,
  ordersListQuerySchema,
} from '@interfaces/http/schemas/orders.schemas.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const orders = new PrismaOrderRepository(prisma);
  const products = new PrismaProductRepository(prisma);
  const createUseCase = new CreateOrderUseCase(orders, products);
  const queryUseCase = new QueryOrdersUseCase(orders);

  app.post(
    '/orders',
    {
      preHandler: app.authorize([Role.CUSTOMER, Role.ADMIN]),
      schema: createOrderRouteSchema,
    },
    async (req, reply) => {
      const data = createOrderBodySchema.parse(req.body);
      const result = await createUseCase.execute({
        customerId: req.user.sub,
        items: data.items,
      });
      return reply.status(201).send(result);
    },
  );

  app.get(
    '/orders',
    {
      preHandler: app.authorize(),
      schema: listOrdersRouteSchema,
    },
    async (req) => {
      const { customerId } = ordersListQuerySchema.parse(req.query);
      return queryUseCase.listForRequester(
        { sub: req.user.sub, role: req.user.role },
        customerId,
      );
    },
  );

  app.get(
    '/orders/:id',
    {
      preHandler: app.authorize(),
      schema: getOrderByIdRouteSchema,
    },
    async (req) => {
      const { id } = orderIdParamSchema.parse(req.params);
      return queryUseCase.getById(id, { sub: req.user.sub, role: req.user.role });
    },
  );
}
