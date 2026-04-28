import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { DomainError } from '@shared/errors/domain-error.js';
import { logger } from '@shared/logger.js';

/**
 * Handler central de erros. Mapeia DomainError, ZodError e erros nativos
 * em um formato JSON consistente.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof DomainError) {
      return reply.status(err.statusCode).send({
        error: err.code,
        message: err.message,
      });
    }

    if (err instanceof ZodError) {
      return reply.status(422).send({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: err.issues,
      });
    }

    // Fastify validation
    if (err.validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: err.message,
        details: err.validation,
      });
    }

    if (err.statusCode && err.statusCode < 500) {
      return reply.status(err.statusCode).send({
        error: err.code ?? 'CLIENT_ERROR',
        message: err.message,
      });
    }

    logger.error({ err }, 'Erro não tratado');
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    });
  });
}
