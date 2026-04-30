import type { FastifyInstance } from 'fastify';
import { Role } from '@domain/enums.js';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductByIdUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
} from '@application/use-cases/product/index.js';
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
  const products = new PrismaProductRepository(prisma);
  const listProductsUseCase = new ListProductsUseCase(products);
  const getProductByIdUseCase = new GetProductByIdUseCase(products);
  const createProductUseCase = new CreateProductUseCase(products);
  const updateProductUseCase = new UpdateProductUseCase(products);
  const deleteProductUseCase = new DeleteProductUseCase(products);

  app.get(
    '/products',
    {
      schema: listProductsRouteSchema,
    },
    async () => listProductsUseCase.execute(),
  );

  app.get(
    '/products/:id',
    {
      schema: getProductByIdRouteSchema,
    },
    async (req) => {
      const { id } = productIdParamSchema.parse(req.params);
      return getProductByIdUseCase.execute(id);
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
      const created = await createProductUseCase.execute(data);
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
      return updateProductUseCase.execute(id, data);
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
      await deleteProductUseCase.execute(id);
      return reply.status(204).send();
    },
  );
}
