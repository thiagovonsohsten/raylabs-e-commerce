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
    return <div className="rounded bg-white p-8 shadow">Carregando pedidos...</div>;
  }
  if (isError) {
    return (
      <div className="rounded bg-red-50 p-4 text-red-700">
        Erro ao carregar pedidos. Faça login novamente.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Meus pedidos</h1>
      <p className="text-sm text-slate-600 mb-6">
        Atualizando automaticamente a cada 3 segundos. O status muda conforme os
        consumers (pagamento e estoque) processam os eventos.
      </p>
      {data?.length === 0 && (
        <div className="rounded bg-white p-8 text-center shadow text-slate-600">
          Você ainda não tem pedidos.
        </div>
      )}
      <div className="space-y-4">
        {data?.map((order) => (
          <article key={order.id} className="rounded-lg bg-white p-5 shadow">
            <header className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-xs text-slate-500">Pedido</p>
                <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
              </div>
              <StatusBadge status={order.status} />
              <div className="text-right">
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-bold">
                  {order.total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            </header>
            <ul className="text-sm text-slate-700 divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="py-2 flex justify-between">
                  <span>
                    {item.quantity}× {item.productName}
                  </span>
                  <span>
                    {item.subtotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <footer className="text-xs text-slate-400 mt-3">
              Criado em {new Date(order.createdAt).toLocaleString('pt-BR')} · Atualizado em{' '}
              {new Date(order.updatedAt).toLocaleString('pt-BR')}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
