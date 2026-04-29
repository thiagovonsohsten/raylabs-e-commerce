import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export default function CheckoutPage() {
  const cart = useCartStore();
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cart.items.length === 0) {
    return (
      <div className="card-dark mx-auto max-w-lg text-center">
        <h1 className="mb-2 text-2xl font-semibold text-white">Carrinho vazio</h1>
        <p className="mb-6 text-zinc-400">Adicione produtos antes de finalizar.</p>
        <button type="button" onClick={() => navigate('/products')} className="btn-gradient px-8">
          Ver produtos
        </button>
      </div>
    );
  }

  if (!auth.token) {
    return (
      <div className="card-dark mx-auto max-w-lg text-center">
        <h1 className="mb-2 text-2xl font-semibold text-white">Faça login para continuar</h1>
        <p className="mb-6 text-sm text-zinc-400">Você precisa estar autenticado para criar um pedido.</p>
        <button type="button" onClick={() => navigate('/login')} className="btn-gradient px-8">
          Entrar
        </button>
      </div>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const items = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      await api.post('/orders', { items });
      cart.clear();
      navigate('/orders');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? 'Erro ao criar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Checkout</h1>
      <p className="mb-6 text-sm text-zinc-400">Revise os itens e finalize o pedido.</p>
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-ray-card/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-left text-zinc-400">
              <tr>
                <th className="p-3 font-medium">Produto</th>
                <th className="p-3 font-medium">Preço</th>
                <th className="p-3 font-medium">Qtd</th>
                <th className="p-3 font-medium">Subtotal</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId} className="border-t border-zinc-800/80">
                  <td className="p-3 font-medium text-zinc-100">{item.productName}</td>
                  <td className="p-3 text-zinc-300">
                    {item.unitPrice.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) =>
                        cart.updateQty(item.productId, Math.max(0, Number(e.target.value)))
                      }
                      className="input-dark w-20 py-1.5 text-center"
                    />
                  </td>
                  <td className="p-3 text-zinc-200">
                    {(item.unitPrice * item.quantity).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => cart.removeItem(item.productId)}
                      className="text-sm text-red-400 hover:text-red-300 hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-800 bg-zinc-900/50">
                <td className="p-3 font-semibold text-white" colSpan={3}>
                  Total
                </td>
                <td className="p-3 text-lg font-bold text-white" colSpan={2}>
                  {cart.total().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => navigate('/products')} className="btn-outline">
          Continuar comprando
        </button>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-gradient px-8">
          {submitting ? 'Enviando...' : 'Finalizar pedido'}
        </button>
      </div>
    </div>
  );
}
