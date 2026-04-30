import { z } from 'zod';

export const customerIdParamSchema = z.object({ id: z.string().uuid() });

export const getMeRouteSchema = {
  tags: ['customers'],
  summary: 'Dados do cliente autenticado',
  security: [{ bearerAuth: [] }],
};

export const getCustomerByIdRouteSchema = {
  tags: ['customers'],
  summary: 'Buscar cliente por id',
  security: [{ bearerAuth: [] }],
};

export const listCustomersRouteSchema = {
  tags: ['customers'],
  summary: 'Listar clientes (admin)',
  security: [{ bearerAuth: [] }],
};
