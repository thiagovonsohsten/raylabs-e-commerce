import { z } from 'zod';

export const createOrderBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const orderIdParamSchema = z.object({ id: z.string().uuid() });
export const ordersListQuerySchema = z.object({ customerId: z.string().uuid().optional() });

export const createOrderRouteSchema = {
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
};

export const listOrdersRouteSchema = {
  tags: ['orders'],
  summary: 'Listar pedidos (cliente: próprios; admin: todos)',
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: { customerId: { type: 'string', format: 'uuid' } },
  },
};

export const getOrderByIdRouteSchema = {
  tags: ['orders'],
  summary: 'Detalhe de pedido',
  security: [{ bearerAuth: [] }],
};
