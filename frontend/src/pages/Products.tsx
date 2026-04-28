import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { data, isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => (await api.get<Product[]>('/products')).data,
  });

  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) return <Skeleton />;
  if (isError) {
    return (
      <div className="rounded bg-red-50 p-4 text-red-700">
        Erro ao carregar produtos.{' '}
        <button onClick={() => refetch()} className="underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Produtos</h1>
      <p className="text-sm text-slate-600 mb-6">
        Adicione itens ao carrinho e finalize a compra.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((p) => (
          <article
            key={p.id}
            className="rounded-lg border bg-white shadow-sm p-5 flex flex-col"
          >
            <h3 className="font-semibold text-lg">{p.name}</h3>
            <p className="text-emerald-600 font-bold text-2xl mt-2">
              {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {p.stock > 0 ? `${p.stock} em estoque` : 'Sem estoque'}
            </p>
            <button
              onClick={() => addItem({ productId: p.id, productName: p.name, unitPrice: p.price })}
              disabled={p.stock === 0}
              className="mt-4 w-full rounded bg-slate-900 text-white py-2 font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {p.stock === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  );
}
