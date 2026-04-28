/**
 * Garante que uma mesma mensagem (messageId) não seja processada 2x pelo mesmo consumer.
 * A implementação grava na tabela ProcessedEvent.
 */
export interface IdempotencyStore {
  alreadyProcessed(messageId: string, consumer: string): Promise<boolean>;
  markProcessed(messageId: string, consumer: string): Promise<void>;
}
