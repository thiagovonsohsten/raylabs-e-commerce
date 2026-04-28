import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount());
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link to="/products" className="text-xl font-bold tracking-tight">
            RayLabs <span className="text-emerald-400">e-commerce</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/products" className="hover:text-emerald-400">
              Produtos
            </Link>
            <Link to="/checkout" className="hover:text-emerald-400 relative">
              Carrinho
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-4 rounded-full bg-emerald-500 px-2 text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            {auth.token ? (
              <>
                <Link to="/orders" className="hover:text-emerald-400">
                  Meus pedidos
                </Link>
                <span className="text-slate-300 hidden sm:inline">
                  {auth.customer?.name} ({auth.customer?.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded bg-slate-700 px-3 py-1.5 hover:bg-slate-600"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-emerald-400">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded bg-emerald-500 px-3 py-1.5 font-medium text-slate-900 hover:bg-emerald-400"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      <footer className="border-t bg-white text-center text-xs text-slate-500 py-4">
        RayLabs Desafio Técnico — fluxo síncrono e assíncrono com RabbitMQ.
      </footer>
    </div>
  );
}
