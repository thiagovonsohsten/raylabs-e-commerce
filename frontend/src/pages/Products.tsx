import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/types';

export default function ProductsPage() {
  const customer = useAuthStore((s) => s.customer);
  const { data, isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => (await api.get<Product[]>('/products')).data,
  });

  const addItem = useCartStore((s) => s.addItem);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    stock: '',
  });
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);

  const isAdmin = customer?.role === 'ADMIN';

  function updateForm(key: 'name' | 'price' | 'stock', value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateEditForm(key: 'name' | 'price' | 'stock', value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(product: Product) {
    setManageError(null);
    setManageSuccess(null);
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: '', price: '', stock: '' });
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.name.trim()) {
      setCreateError('Informe o nome do produto.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setCreateError('Preço inválido. Use um valor maior que zero.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setCreateError('Estoque inválido. Use um número inteiro maior ou igual a zero.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/products', {
        name: form.name.trim(),
        price,
        stock,
      });
      setForm({ name: '', price: '', stock: '' });
      setCreateSuccess('Produto cadastrado com sucesso.');
      await refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setCreateError(msg ?? 'Falha ao cadastrar produto.');
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateProduct(e: React.FormEvent, productId: string) {
    e.preventDefault();
    setManageError(null);
    setManageSuccess(null);

    const price = Number(editForm.price);
    const stock = Number(editForm.stock);

    if (!editForm.name.trim()) {
      setManageError('Informe o nome do produto.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setManageError('Preço inválido. Use um valor maior que zero.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setManageError('Estoque inválido. Use um número inteiro maior ou igual a zero.');
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/products/${productId}`, {
        name: editForm.name.trim(),
        price,
        stock,
      });
      setManageSuccess('Produto atualizado com sucesso.');
      cancelEdit();
      await refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setManageError(msg ?? 'Falha ao atualizar produto.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteProduct(productId: string, productName: string) {
    const ok = window.confirm(`Tem certeza que deseja remover "${productName}"?`);
    if (!ok) return;

    setManageError(null);
    setManageSuccess(null);
    setDeletingId(productId);
    try {
      await api.delete(`/products/${productId}`);
      if (editingId === productId) {
        cancelEdit();
      }
      setManageSuccess('Produto removido com sucesso.');
      await refetch();
    } catch (err: unknown) {
      const status =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : null;
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      if (status === 409) {
        setManageError(
          msg ?? 'Produto não pode ser removido porque já está vinculado a pedidos.',
        );
      } else {
        setManageError(msg ?? 'Falha ao remover produto.');
      }
    } finally {
      setDeletingId(null);
    }
  }

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
      {isAdmin && (
        <section className="card-dark mb-8">
          <h2 className="mb-1 text-lg font-semibold text-white">Cadastrar produto</h2>
          <p className="mb-4 text-sm text-zinc-400">Preencha nome, preço e estoque.</p>
          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="input-dark"
                placeholder="Ex: Mouse Gamer"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Preço</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => updateForm('price', e.target.value)}
                className="input-dark"
                placeholder="99.90"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Estoque</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => updateForm('stock', e.target.value)}
                className="input-dark"
                placeholder="10"
                required
              />
            </div>
            <div className="md:col-span-4 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={creating} className="btn-gradient px-6">
                {creating ? 'Cadastrando...' : 'Cadastrar produto'}
              </button>
              {createError && <p className="text-sm text-red-400">{createError}</p>}
              {createSuccess && <p className="text-sm text-emerald-400">{createSuccess}</p>}
              {manageError && <p className="text-sm text-red-400">{manageError}</p>}
              {manageSuccess && <p className="text-sm text-emerald-400">{manageSuccess}</p>}
            </div>
          </form>
        </section>
      )}
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
            {isAdmin && editingId !== p.id && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => startEdit(p)} className="btn-outline !py-2">
                  Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(p.id, p.name)}
                  disabled={deletingId === p.id}
                  className="rounded-lg border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === p.id ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            )}
            {isAdmin && editingId === p.id && (
              <form onSubmit={(e) => handleUpdateProduct(e, p.id)} className="mt-4 space-y-2 rounded-xl border border-zinc-700 bg-zinc-900/70 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Editando produto
                </p>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                  className="input-dark"
                  placeholder="Nome"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => updateEditForm('price', e.target.value)}
                    className="input-dark"
                    placeholder="Preço"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.stock}
                    onChange={(e) => updateEditForm('stock', e.target.value)}
                    className="input-dark"
                    placeholder="Estoque"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={updating} className="btn-gradient flex-1 !py-2">
                    {updating ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" onClick={cancelEdit} className="btn-outline flex-1 !py-2">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
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
