import type { OrderStatus } from '@/types';

const STYLES: Record<OrderStatus, { label: string; classes: string }> = {
  PENDING_PAYMENT: {
    label: 'Aguardando pagamento',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  CONFIRMED: {
    label: 'Confirmado',
    classes: 'bg-green-100 text-green-800 border-green-300',
  },
  CANCELLED: {
    label: 'Cancelado (sem estoque)',
    classes: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  PAYMENT_FAILED: {
    label: 'Pagamento recusado',
    classes: 'bg-red-100 text-red-800 border-red-300',
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.classes}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}
