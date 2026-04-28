import { loadConfig } from '@shared/config.js';
import { logger } from '@shared/logger.js';
import { disconnectPrisma, getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { closeConnection } from '@infrastructure/messaging/rabbitmq-connection.js';
import { startConsumer } from '@infrastructure/messaging/rabbitmq-consumer.js';
import { RabbitMqPublisher } from '@infrastructure/messaging/rabbitmq-publisher.js';
import { Queues } from '@infrastructure/messaging/topology.js';
import { PrismaIdempotencyStore } from '@infrastructure/repositories/prisma-idempotency-store.js';
import {
  PAYMENT_CONSUMER_NAME,
  makePaymentHandler,
} from '@interfaces/consumers/payment-consumer.js';

async function main() {
  process.env.SERVICE_NAME = 'payment-consumer';
  const config = loadConfig();
  const prisma = getPrismaClient();
  const publisher = new RabbitMqPublisher(config.RABBITMQ_URL);
  const idempotency = new PrismaIdempotencyStore(prisma);

  const handler = makePaymentHandler({
    prisma,
    publisher,
    idempotency,
    config: {
      successRate: config.PAYMENT_SUCCESS_RATE,
      processingMs: config.PAYMENT_PROCESSING_MS,
    },
  });

  await startConsumer(
    {
      url: config.RABBITMQ_URL,
      queue: Queues.PAYMENT_PROCESS,
      consumerName: PAYMENT_CONSUMER_NAME,
      maxAttempts: config.MAX_DELIVERY_ATTEMPTS,
      retryBaseDelayMs: config.RETRY_BASE_DELAY_MS,
    },
    handler,
  );

  const close = async (signal: string) => {
    logger.info({ signal }, 'Encerrando payment consumer...');
    await disconnectPrisma();
    await closeConnection();
    process.exit(0);
  };
  process.on('SIGTERM', () => close('SIGTERM'));
  process.on('SIGINT', () => close('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao iniciar payment consumer.');
  process.exit(1);
});
