import { v4 as uuid } from 'uuid';
import { logger } from '@shared/logger.js';
import { Exchanges } from './topology.js';
import { getChannel } from './rabbitmq-connection.js';

/**
 * Publisher de eventos. Sempre publica na exchange principal (orders.events).
 * Mensagens são persistentes (delivery_mode=2). Inclui um messageId único
 * que serve de chave para a tabela ProcessedEvent (idempotência).
 */
export class RabbitMqPublisher {
  constructor(private readonly url: string) {}

  async publish(routingKey: string, payload: object, messageId?: string): Promise<void> {
    const ch = await getChannel(this.url);
    const id = messageId ?? uuid();
    const ok = ch.publish(
      Exchanges.EVENTS,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: 'application/json',
        messageId: id,
        timestamp: Date.now(),
      },
    );
    if (!ok) {
      logger.warn({ routingKey, id }, 'Buffer do canal cheio — aguarde drain.');
      await new Promise<void>((resolve) => ch.once('drain', () => resolve()));
    }
    logger.debug({ routingKey, messageId: id }, 'Evento publicado.');
  }
}
