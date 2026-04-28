import type { FastifyInstance } from 'fastify';
import type { Role } from '@domain/enums.js';
import { UnauthorizedError } from '@shared/errors/domain-error.js';
import type { TokenPayload, TokenService } from '@application/ports/token-service.js';

/**
 * Implementação que delega assinatura/verificação ao @fastify/jwt já registrado no app.
 * Mantemos a porta TokenService para que use-cases sigam testáveis sem Fastify.
 */
export class FastifyJwtTokenService implements TokenService {
  constructor(private readonly app: FastifyInstance) {}

  async sign(payload: TokenPayload): Promise<string> {
    return this.app.jwt.sign(payload);
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const decoded = this.app.jwt.verify<TokenPayload>(token);
      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role as Role,
      };
    } catch {
      throw new UnauthorizedError('Token inválido ou expirado.');
    }
  }
}
