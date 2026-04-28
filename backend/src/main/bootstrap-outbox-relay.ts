import { OutboxRelay } from '@interfaces/consumers/outbox-relay.js';
import { loadConfig } from '@shared/config.js';
import { logger } from '@shared/logger.js';
import { disconnectPrisma, getPrismaClient } from '@infrastructure/database/prisma-client.js';
import { closeConnection, getChannel } from '@infrastructure/messaging/rabbitmq-connection.js';
import { RabbitMqPublisher } from '@infrastructure/messaging/rabbitmq-publisher.js';

async function main() {
  process.env.SERVICE_NAME = 'outbox-relay';
  const config = loadConfig();

  // Garante que a topologia esteja declarada antes de publicar
  await getChannel(config.RABBITMQ_URL);

  const prisma = getPrismaClient();
  const publisher = new RabbitMqPublisher(config.RABBITMQ_URL);
  const relay = new OutboxRelay(prisma, publisher, {
    pollIntervalMs: config.OUTBOX_POLL_INTERVAL_MS,
    batchSize: config.OUTBOX_BATCH_SIZE,
  });

  relay.start();

  const close = async (signal: string) => {
    logger.info({ signal }, 'Encerrando outbox relay...');
    relay.stop();
    await disconnectPrisma();
    await closeConnection();
    process.exit(0);
  };
  process.on('SIGTERM', () => close('SIGTERM'));
  process.on('SIGINT', () => close('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao iniciar outbox relay.');
  process.exit(1);
});
