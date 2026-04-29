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
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-red-200">
        Erro ao carregar produtos.{' '}
        <button type="button" onClick={() => refetch()} className="font-medium text-[#c77dff] hover:underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Produtos</h1>
      <p className="mb-8 max-w-xl text-sm text-zinc-400">
        Adicione itens ao carrinho e finalize a compra. Preços e estoque vêm da API.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <article
            key={p.id}
            className="group flex flex-col rounded-2xl border border-zinc-800/90 bg-ray-card/80 p-5 shadow-lg transition-colors hover:border-zinc-700 hover:shadow-glow"
          >
            <h3 className="text-lg font-semibold text-white">{p.name}</h3>
            <p className="mt-3 bg-gradient-to-r from-[#c77dff] to-[#9d4edd] bg-clip-text text-2xl font-bold text-transparent">
              {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {p.stock > 0 ? `${p.stock} em estoque` : 'Sem estoque'}
            </p>
            <button
              type="button"
              onClick={() => addItem({ productId: p.id, productName: p.name, unitPrice: p.price })}
              disabled={p.stock === 0}
              className="btn-gradient mt-4 w-full"
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800" />
      ))}
    </div>
  );
}
