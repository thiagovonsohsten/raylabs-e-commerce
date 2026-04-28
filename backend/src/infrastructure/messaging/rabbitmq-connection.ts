import amqp, { type Channel, type ChannelModel } from 'amqplib';
import { logger } from '@shared/logger.js';
import { Bindings, Exchanges, Queues, dlqName } from './topology.js';

/**
 * Conexão singleton ao RabbitMQ. Faz reconnect automático em caso de queda.
 * Declara toda a topologia (exchanges, filas, bindings, DLQs) ao conectar.
 */
let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let connecting: Promise<Channel> | null = null;

export async function getChannel(url: string): Promise<Channel> {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = connect(url);
  try {
    channel = await connecting;
    return channel;
  } finally {
    connecting = null;
  }
}

async function connect(url: string): Promise<Channel> {
  logger.info({ url: redactUrl(url) }, 'Conectando ao RabbitMQ...');
  connection = await amqp.connect(url);
  connection.on('error', (err) => {
    logger.error({ err }, 'Conexão RabbitMQ caiu (error).');
  });
  connection.on('close', () => {
    logger.warn('Conexão RabbitMQ fechada. Resetando estado.');
    connection = null;
    channel = null;
  });

  const ch = await connection.createChannel();
  await ch.prefetch(10);

  await declareTopology(ch);
  logger.info('RabbitMQ conectado e topologia declarada.');
  return ch;
}

async function declareTopology(ch: Channel): Promise<void> {
  // Exchanges
  await ch.assertExchange(Exchanges.EVENTS, 'topic', { durable: true });
  await ch.assertExchange(Exchanges.DLX, 'topic', { durable: true });
  await ch.assertExchange(Exchanges.RETRY, 'x-delayed-message', {
    durable: true,
    arguments: { 'x-delayed-type': 'topic' },
  });

  // Filas + bindings + DLQ por consumer
  for (const queue of Object.values(Queues)) {
    const dlq = dlqName(queue);

    // DLQ: simples fila durável vinculada ao DLX com routing key = nome da fila
    await ch.assertQueue(dlq, { durable: true });
    await ch.bindQueue(dlq, Exchanges.DLX, queue);

    // Fila principal — quando descartada, vai para DLX com routing key = nome da fila
    await ch.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': Exchanges.DLX,
        'x-dead-letter-routing-key': queue,
      },
    });

    // Bindings: a fila escuta eventos da exchange principal e da retry exchange
    const routingKeys = Bindings[queue as keyof typeof Bindings] ?? [];
    for (const rk of routingKeys) {
      await ch.bindQueue(queue, Exchanges.EVENTS, rk);
      await ch.bindQueue(queue, Exchanges.RETRY, rk);
    }
  }
}

export async function closeConnection(): Promise<void> {
  try {
    if (channel) await channel.close();
  } catch {
    // ignora
  }
  try {
    if (connection) await connection.close();
  } catch {
    // ignora
  }
  channel = null;
  connection = null;
}

function redactUrl(url: string): string {
  return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}
