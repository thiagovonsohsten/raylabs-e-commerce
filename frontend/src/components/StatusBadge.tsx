import type { OrderStatus } from '@/types';

const STYLES: Record<OrderStatus, { label: string; classes: string }> = {
  PENDING_PAYMENT: {
    label: 'Aguardando pagamento',
    classes:
      'border-amber-500/40 bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20',
  },
  CONFIRMED: {
    label: 'Confirmado',
    classes: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/20',
  },
  CANCELLED: {
    label: 'Cancelado (sem estoque)',
    classes: 'border-orange-500/40 bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/20',
  },
  PAYMENT_FAILED: {
    label: 'Pagamento recusado',
    classes: 'border-red-500/40 bg-red-500/15 text-red-200 ring-1 ring-red-500/20',
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.classes}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-90" />
      {cfg.label}
    </span>
  );
}
