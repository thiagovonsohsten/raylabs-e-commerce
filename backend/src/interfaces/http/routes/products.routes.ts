import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@domain/enums.js';
import { ProductUseCases } from '@application/use-cases/product/index.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

export async function productsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const useCases = new ProductUseCases(new PrismaProductRepository(prisma));

  app.get(
    '/products',
    {
      schema: {
        tags: ['products'],
        summary: 'Listar produtos (público)',
      },
    },
    async () => useCases.list(),
  );

  app.get(
    '/products/:id',
    {
      schema: {
        tags: ['products'],
        summary: 'Buscar produto por id',
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (req) => {
      const { id } = idParamSchema.parse(req.params);
      return useCases.getById(id);
    },
  );

  app.post(
    '/products',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: {
        tags: ['products'],
        summary: 'Criar produto (admin)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'price', 'stock'],
          properties: {
            name: { type: 'string', minLength: 1 },
            price: { type: 'number', exclusiveMinimum: 0 },
            stock: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
    async (req, reply) => {
      const data = createSchema.parse(req.body);
      const created = await useCases.create(data);
      return reply.status(201).send(created);
    },
  );

  app.put(
    '/products/:id',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: {
        tags: ['products'],
        summary: 'Atualizar produto (admin)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (req) => {
      const { id } = idParamSchema.parse(req.params);
      const data = updateSchema.parse(req.body);
      return useCases.update(id, data);
    },
  );

  app.delete(
    '/products/:id',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: {
        tags: ['products'],
        summary: 'Remover produto (admin)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (req, reply) => {
      const { id } = idParamSchema.parse(req.params);
      await useCases.delete(id);
      return reply.status(204).send();
    },
  );
}
