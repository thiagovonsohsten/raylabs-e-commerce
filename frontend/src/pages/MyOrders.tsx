import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { StatusBadge } from '@/components/StatusBadge';
import type { Order } from '@/types';

/**
 * Página "Meus Pedidos" com polling a cada 3 segundos.
 *
 * O status do pedido é atualizado de forma assíncrona pelos consumers
 * (payment + inventory). O frontend reflete isso pulando reativamente
 * de PENDING_PAYMENT → CONFIRMED / CANCELLED / PAYMENT_FAILED sem reload.
 */
export default function MyOrdersPage() {
  const { data, isLoading, isError } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get<Order[]>('/orders')).data,
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="card-dark flex items-center justify-center py-16 text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#9d4edd]" />
          Carregando pedidos...
        </span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-red-200">
        Erro ao carregar pedidos. Faça login novamente.
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Meus pedidos</h1>
      <p className="mb-8 max-w-2xl text-sm text-zinc-400">
        Atualizando automaticamente a cada 3 segundos. O status muda conforme os consumers (pagamento e
        estoque) processam os eventos.
      </p>
      {data?.length === 0 && (
        <div className="card-dark text-center text-zinc-400">Você ainda não tem pedidos.</div>
      )}
      <div className="space-y-4">
        {data?.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-zinc-800/90 bg-ray-card/80 p-5 shadow-lg transition-shadow hover:shadow-glow"
          >
            <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Pedido</p>
                <p className="font-mono text-sm text-zinc-200">{order.id.slice(0, 8)}…</p>
              </div>
              <StatusBadge status={order.status} />
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Total</p>
                <p className="text-lg font-bold text-white">
                  {order.total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            </header>
            <ul className="divide-y divide-zinc-800 text-sm text-zinc-300">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-2.5 first:pt-0">
                  <span>
                    {item.quantity}× {item.productName}
                  </span>
                  <span className="shrink-0 text-zinc-200">
                    {item.subtotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <footer className="mt-3 text-xs text-zinc-500">
              Criado em {new Date(order.createdAt).toLocaleString('pt-BR')} · Atualizado em{' '}
              {new Date(order.updatedAt).toLocaleString('pt-BR')}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
