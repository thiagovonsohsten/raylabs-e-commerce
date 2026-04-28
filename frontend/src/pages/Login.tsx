import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
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
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Falha no login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold mb-2">Entrar</h1>
        <p className="text-sm text-slate-600 mb-6">
          Use as credenciais demo abaixo ou{' '}
          <Link to="/register" className="text-emerald-600 hover:underline">
            crie uma conta
          </Link>
          .
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-emerald-500 py-2 font-medium text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-6 rounded bg-slate-50 p-3 text-xs text-slate-600">
          <strong>Demo:</strong>
          <br />
          Cliente: <code>cliente@raylabs.dev / cliente123</code>
          <br />
          Admin: <code>admin@raylabs.dev / admin123</code>
        </div>
      </div>
    </div>
  );
}
