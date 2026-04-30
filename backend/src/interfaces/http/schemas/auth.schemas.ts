import { z } from 'zod';

export const registerBodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  document: z.string().min(11).max(20),
  password: z.string().min(6).max(72),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerRouteSchema = {
  tags: ['auth'],
  summary: 'Registrar novo cliente',
  body: {
    type: 'object',
    required: ['name', 'email', 'document', 'password'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 120 },
      email: { type: 'string', format: 'email' },
      document: { type: 'string', description: 'CPF ou CNPJ' },
      password: { type: 'string', minLength: 6 },
    },
  },
};

export const loginRouteSchema = {
  tags: ['auth'],
  summary: 'Login com e-mail e senha',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
};
