import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { BrandLogo } from '@/components/BrandLogo';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-white/10 text-white shadow-inner ring-1 ring-[#9d4edd]/40'
      : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100',
  ].join(' ');

export function Layout({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const customer = useAuthStore((s) => s.customer);
  const logout = useAuthStore((s) => s.logout);
  const count = useCartStore((s) => s.itemCount());

  return (
    <div className="flex min-h-full flex-col bg-black">
      <header className="sticky top-0 z-20 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandLogo />
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            <NavLink to="/products" className={navLinkClass}>
              Produtos
            </NavLink>
            <NavLink to="/checkout" className={navLinkClass}>
              Carrinho
              {count > 0 && (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-[#c77dff] to-[#9d4edd] px-1.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </NavLink>
            {token ? (
              <>
                <NavLink to="/orders" className={navLinkClass}>
                  Pedidos
                </NavLink>
                <span className="hidden text-xs text-zinc-500 sm:inline max-w-[140px] truncate">
                  {customer?.name}
                </span>
                <button type="button" onClick={logout} className="btn-outline !py-2 text-xs">
                  Sair
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Entrar
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-[#c77dff] to-[#9d4edd] px-3 py-2 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
                >
                  Cadastrar
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        {/* Luz ambiente sutil atrás do conteúdo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, #9d4edd, transparent), radial-gradient(ellipse 60% 40% at 100% 50%, #c77dff22, transparent)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        Ray Labs · fluxo assíncrono com pagamento e estoque
      </footer>
    </div>
  );
}
