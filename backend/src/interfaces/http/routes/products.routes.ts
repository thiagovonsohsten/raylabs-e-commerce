import type { FastifyInstance } from 'fastify';
import { Role } from '@domain/enums.js';
import { ProductUseCases } from '@application/use-cases/product/index.js';
import { getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { PrismaProductRepository } from '@infrastructure/repositories/prisma-product-repository.js';
import {
  createProductBodySchema,
  createProductRouteSchema,
  deleteProductRouteSchema,
  getProductByIdRouteSchema,
  listProductsRouteSchema,
  productIdParamSchema,
  updateProductBodySchema,
  updateProductRouteSchema,
} from '@interfaces/http/schemas/products.schemas.js';

export async function productsRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrismaClient();
  const useCases = new ProductUseCases(new PrismaProductRepository(prisma));

  app.get(
    '/products',
    {
      schema: listProductsRouteSchema,
    },
    async () => useCases.list(),
  );

  app.get(
    '/products/:id',
    {
      schema: getProductByIdRouteSchema,
    },
    async (req) => {
      const { id } = productIdParamSchema.parse(req.params);
      return useCases.getById(id);
    },
  );

  app.post(
    '/products',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: createProductRouteSchema,
    },
    async (req, reply) => {
      const data = createProductBodySchema.parse(req.body);
      const created = await useCases.create(data);
      return reply.status(201).send(created);
    },
  );

  app.put(
    '/products/:id',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: updateProductRouteSchema,
    },
    async (req) => {
      const { id } = productIdParamSchema.parse(req.params);
      const data = updateProductBodySchema.parse(req.body);
      return useCases.update(id, data);
    },
  );

  app.delete(
    '/products/:id',
    {
      preHandler: app.authorize([Role.ADMIN]),
      schema: deleteProductRouteSchema,
    },
    async (req, reply) => {
      const { id } = productIdParamSchema.parse(req.params);
      await useCases.delete(id);
      return reply.status(204).send();
    },
  );
}
