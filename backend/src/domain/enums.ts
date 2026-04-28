/**
 * Enums de domínio. Devem coincidir com os enums do Prisma para evitar mapping.
 */
export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const Role = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OutboxEventStatus = {
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  FAILED: 'FAILED',
} as const;
export type OutboxEventStatus = (typeof OutboxEventStatus)[keyof typeof OutboxEventStatus];
