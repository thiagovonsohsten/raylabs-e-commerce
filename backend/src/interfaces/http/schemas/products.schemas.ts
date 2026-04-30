import { z } from 'zod';

export const createProductBodySchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

export const updateProductBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
});

export const productIdParamSchema = z.object({ id: z.string().uuid() });

export const listProductsRouteSchema = {
  tags: ['products'],
  summary: 'Listar produtos (público)',
};

export const getProductByIdRouteSchema = {
  tags: ['products'],
  summary: 'Buscar produto por id',
  params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
};

export const createProductRouteSchema = {
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
};

export const updateProductRouteSchema = {
  tags: ['products'],
  summary: 'Atualizar produto (admin)',
  security: [{ bearerAuth: [] }],
  params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
};

export const deleteProductRouteSchema = {
  tags: ['products'],
  summary: 'Remover produto (admin)',
  security: [{ bearerAuth: [] }],
  params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
};
