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
      <div className="rounded bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold mb-2">Carrinho vazio</h1>
        <p className="text-slate-600 mb-4">Adicione produtos antes de finalizar.</p>
        <button
          onClick={() => navigate('/products')}
          className="rounded bg-emerald-500 px-4 py-2 font-medium text-slate-900 hover:bg-emerald-400"
        >
          Ver produtos
        </button>
      </div>
    );
  }

  if (!auth.token) {
    return (
      <div className="rounded bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold mb-2">Faça login para continuar</h1>
        <button
          onClick={() => navigate('/login')}
          className="rounded bg-emerald-500 px-4 py-2 font-medium text-slate-900 hover:bg-emerald-400"
        >
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
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao criar pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="rounded-lg bg-white shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Qtd</th>
              <th className="p-3">Subtotal</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.productId} className="border-t">
                <td className="p-3 font-medium">{item.productName}</td>
                <td className="p-3">
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
                    className="w-16 rounded border px-2 py-1"
                  />
                </td>
                <td className="p-3">
                  {(item.unitPrice * item.quantity).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => cart.removeItem(item.productId)}
                    className="text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-slate-50">
              <td className="p-3 font-bold" colSpan={3}>
                Total
              </td>
              <td className="p-3 font-bold text-lg" colSpan={2}>
                {cart.total().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => navigate('/products')}
          className="rounded border px-4 py-2 hover:bg-slate-50"
        >
          Continuar comprando
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded bg-emerald-500 px-6 py-2 font-medium text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Finalizar pedido'}
        </button>
      </div>
    </div>
  );
}
