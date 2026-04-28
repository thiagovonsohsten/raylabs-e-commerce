import type { Channel, ConsumeMessage } from 'amqplib';
import { v4 as uuid } from 'uuid';
import { logger } from '@shared/logger.js';
import { Exchanges } from './topology.js';
import { getChannel } from './rabbitmq-connection.js';

export interface ConsumerHandlerContext {
  routingKey: string;
  messageId: string;
  attempts: number;
}

/**
 * Função de processamento. Deve lançar exceção em caso de falha
 * — o wrapper trata retry e DLQ automaticamente.
 */
export type ConsumerHandler = (
  payload: unknown,
  context: ConsumerHandlerContext,
) => Promise<void>;

export interface ConsumerConfig {
  url: string;
  queue: string;
  consumerName: string;
  maxAttempts: number;
  retryBaseDelayMs: number;
}

/**
 * Inicia consumo da fila com retry exponencial via x-delayed-message.
 *
 * Estratégia:
 *   - On success: ack.
 *   - On error: incrementa header x-attempts.
 *     - Se < maxAttempts: republica em orders.retry com x-delay = base * 2^attempts.
 *       O delayed exchange entrega na mesma fila após o delay.
 *     - Se >= maxAttempts: nack(requeue=false) → vai para DLX → fila .dlq.
 */
export async function startConsumer(
  config: ConsumerConfig,
  handler: ConsumerHandler,
): Promise<void> {
  const ch = await getChannel(config.url);
  await ch.consume(config.queue, async (msg) => {
    if (!msg) return;
    await processMessage(ch, msg, config, handler);
  });
  logger.info({ queue: config.queue, consumer: config.consumerName }, 'Consumer iniciado.');
}

async function processMessage(
  ch: Channel,
  msg: ConsumeMessage,
  config: ConsumerConfig,
  handler: ConsumerHandler,
): Promise<void> {
  const headers = msg.properties.headers ?? {};
  const attempts = Number(headers['x-attempts'] ?? 0);
  const messageId = msg.properties.messageId ?? uuid();
  const routingKey = msg.fields.routingKey;

  let payload: unknown;
  try {
    payload = JSON.parse(msg.content.toString('utf-8'));
  } catch (err) {
    logger.error({ err, messageId }, 'Payload inválido (não-JSON). Descartando para DLQ.');
    ch.nack(msg, false, false);
    return;
  }

  try {
    await handler(payload, { routingKey, messageId, attempts });
    ch.ack(msg);
  } catch (err) {
    const nextAttempt = attempts + 1;
    const errMessage = err instanceof Error ? err.message : String(err);

    if (nextAttempt >= config.maxAttempts) {
      logger.error(
        { err, messageId, queue: config.queue, attempts: nextAttempt },
        `Falha definitiva após ${nextAttempt} tentativas. Enviando para DLQ.`,
      );
      // nack sem requeue → vai para DLX (configurado na fila) → fila .dlq
      ch.nack(msg, false, false);
      return;
    }

    // Retry: republica em orders.retry com delay exponencial
    const delayMs = config.retryBaseDelayMs * 2 ** attempts;
    logger.warn(
      { err: errMessage, messageId, queue: config.queue, attempt: nextAttempt, delayMs },
      `Falha no consumer. Reagendando retry em ${delayMs}ms (tentativa ${nextAttempt}/${config.maxAttempts}).`,
    );
    ch.publish(Exchanges.RETRY, routingKey, msg.content, {
      persistent: true,
      contentType: msg.properties.contentType ?? 'application/json',
      messageId,
      headers: {
        ...headers,
        'x-attempts': nextAttempt,
        'x-delay': delayMs,
        'x-original-error': errMessage.slice(0, 500),
      },
    });
    ch.ack(msg);
  }
}
