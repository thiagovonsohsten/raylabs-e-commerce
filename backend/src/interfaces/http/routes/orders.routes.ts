import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@domain/enums.js';
import { CreateOrderUseCase } from '@application/use-cases/order/create-order.js';
import { QueryOrdersUseCase } from '@application/use-cases/order/query-orders.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaOrderRepository } from '@infrastructure/repositories/prisma-order-repository.js';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({ customerId: z.string().uuid().optional() });

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
      schema: {
        tags: ['orders'],
        summary: 'Criar pedido (cliente autenticado)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const data = createSchema.parse(req.body);
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
      schema: {
        tags: ['orders'],
        summary: 'Listar pedidos (cliente: próprios; admin: todos)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: { customerId: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (req) => {
      const { customerId } = listQuerySchema.parse(req.query);
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
      schema: {
        tags: ['orders'],
        summary: 'Detalhe de pedido',
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const { id } = idParamSchema.parse(req.params);
      return queryUseCase.getById(id, { sub: req.user.sub, role: req.user.role });
    },
  );
}
