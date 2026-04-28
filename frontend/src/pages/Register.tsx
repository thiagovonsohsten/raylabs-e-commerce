import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    document: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm({ ...form, [key]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Falha no cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold mb-2">Criar conta</h1>
        <p className="text-sm text-slate-600 mb-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Entrar
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome" value={form.name} onChange={(v) => update('name', v)} />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => update('email', v)}
          />
          <Field
            label="CPF ou CNPJ"
            value={form.document}
            onChange={(v) => update('document', v)}
            placeholder="111.444.777-35"
          />
          <Field
            label="Senha"
            type="password"
            value={form.password}
            onChange={(v) => update('password', v)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-emerald-500 py-2 font-medium text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{props.label}</label>
      <input
        type={props.type ?? 'text'}
        required
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}
