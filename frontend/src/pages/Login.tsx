import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('cliente@raylabs.dev');
  const [password, setPassword] = useState('cliente123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data.token, data.customer);
      navigate('/products');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <BrandLogo className="mb-8" imgClassName="h-12 w-auto sm:h-14" />
      <div className="card-dark w-full">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">Entrar</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Use as credenciais demo ou{' '}
          <Link to="/register" className="font-medium text-[#c77dff] hover:text-[#d4a3ff] hover:underline">
            crie uma conta
          </Link>
          .
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gradient w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400">
          <p className="mb-2 font-medium text-zinc-300">Credenciais demo</p>
          <p>
            Cliente: <code className="text-zinc-200">cliente@raylabs.dev</code> /{' '}
            <code className="text-zinc-200">cliente123</code>
          </p>
          <p className="mt-1">
            Admin: <code className="text-zinc-200">admin@raylabs.dev</code> /{' '}
            <code className="text-zinc-200">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
