import type { Role } from '@domain/enums.js';

export interface TokenPayload {
  sub: string; // customer id
  email: string;
  role: Role;
}

/**
 * Porta para emissão/verificação de tokens (JWT).
 */
export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload>;
}
