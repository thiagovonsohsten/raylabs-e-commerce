import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerErrorHandler } from '@interfaces/http/error-handler.js';
import { registerAuthPlugin } from '@interfaces/http/auth-plugin.js';
import { authRoutes } from '@interfaces/http/routes/auth.routes.js';
import { customersRoutes } from '@interfaces/http/routes/customers.routes.js';
import { productsRoutes } from '@interfaces/http/routes/products.routes.js';
import { ordersRoutes } from '@interfaces/http/routes/orders.routes.js';
import { loadConfig } from '@shared/config.js';
import { logger } from '@shared/logger.js';
import { disconnectPrisma } from '@infrastructure/database/prisma-client.js';
import { closeConnection } from '@infrastructure/messaging/rabbitmq-connection.js';

/**
 * Bootstrap da API REST.
 * Workers (consumers, outbox-relay) são processos separados.
 */
async function main() {
  process.env.SERVICE_NAME = 'api';
  const config = loadConfig();
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
    disableRequestLogging: false,
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'RayLabs E-commerce API',
        description:
          'API REST do desafio técnico. Fluxos síncrono (REST) e assíncrono (event-driven via RabbitMQ).',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      tags: [
        { name: 'auth', description: 'Autenticação e registro' },
        { name: 'customers', description: 'Clientes' },
        { name: 'products', description: 'Produtos' },
        { name: 'orders', description: 'Pedidos' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  registerAuthPlugin(app);
  registerErrorHandler(app);

  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/readyz', async () => ({ status: 'ready' }));

  await app.register(authRoutes);
  await app.register(customersRoutes);
  await app.register(productsRoutes);
  await app.register(ordersRoutes);

  const close = async (signal: string) => {
    logger.info({ signal }, 'Encerrando API...');
    try {
      await app.close();
      await disconnectPrisma();
      await closeConnection();
    } catch (err) {
      logger.error({ err }, 'Erro ao encerrar API.');
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => close('SIGTERM'));
  process.on('SIGINT', () => close('SIGINT'));

  try {
    await app.listen({ port: config.API_PORT, host: '0.0.0.0' });
    logger.info(
      { port: config.API_PORT },
      `API rodando em http://localhost:${config.API_PORT} (docs em /docs)`,
    );
  } catch (err) {
    logger.error({ err }, 'Falha ao iniciar API.');
    process.exit(1);
  }
}

main();
