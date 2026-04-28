import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@domain/enums.js';
import { ForbiddenError, UnauthorizedError } from '@shared/errors/domain-error.js';

/**
 * Tipagem do payload do JWT que circula nas requests.
 */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string; role: Role };
    user: { sub: string; email: string; role: Role };
  }
}

/**
 * Cria um pre-handler que exige autenticação e (opcionalmente) certas roles.
 * Usar como `{ preHandler: app.authorize(['ADMIN']) }`.
 */
export function registerAuthPlugin(app: FastifyInstance): void {
  app.decorate('authorize', (allowedRoles?: Role[]) => {
    return async (req: FastifyRequest, _reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch {
        throw new UnauthorizedError('Token ausente, inválido ou expirado.');
      }
      if (allowedRoles && !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Você não tem permissão para esta operação.');
      }
    };
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authorize: (allowedRoles?: Role[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
