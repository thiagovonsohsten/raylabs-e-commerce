/**
 * Erro base para violações de regra de domínio.
 * Não vaza detalhes técnicos para o cliente HTTP.
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = 'DOMAIN_ERROR', statusCode = 400) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string | number) {
    const detail = id !== undefined ? ` com id "${id}"` : '';
    super(`${resource}${detail} não encontrado(a).`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Credenciais inválidas.') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Acesso negado.') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}
